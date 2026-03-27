const Alumni = require("../models/Alumni");
const User = require("../models/User");
const Message = require("../models/Message");
const notificationController = require("./notificationController");

const collaborationTypes = [
  "mentorship collaboration",
  "project collaboration",
  "job referral collaboration"
];

function parseNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function regex(value) {
  return new RegExp(value.trim(), "i");
}

function parseSkills(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function asText(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

async function getDataSource() {
  const alumniCount = await Alumni.countDocuments();
  if (alumniCount > 0) {
    return { source: "alumni", count: alumniCount };
  }

  const userCount = await User.countDocuments({ role: "alumni" });
  return { source: "user", count: userCount };
}

function normalizeAlumniDoc(doc) {
  if (!doc) return null;

  return {
    _id: doc._id,
    receiverUserId: doc.userId || null,
    userId: doc.userId || null,
    name: doc.name || "",
    email: doc.email || "",
    profilePicture: doc.profilePicture || "",
    graduationYear: doc.graduationYear || null,
    degree: doc.degree || "",
    currentCompany: doc.currentCompany || "",
    jobTitle: doc.jobTitle || "",
    industry: doc.industry || "",
    location: doc.location || "",
    skills: Array.isArray(doc.skills) ? doc.skills : [],
    linkedin: doc.linkedin || "",
    bio: doc.bio || "",
    experience: doc.experience || "",
    careerJourney: doc.careerJourney || "",
    connections: Array.isArray(doc.connections) ? doc.connections : []
  };
}

function normalizeUserDoc(user) {
  if (!user) return null;

  return {
    _id: user._id,
    receiverUserId: user._id,
    userId: user._id,
    name: user.name || "",
    email: user.email || "",
    profilePicture: "",
    graduationYear: null,
    degree: "",
    currentCompany: user.company || "",
    jobTitle: "",
    industry: "",
    location: "",
    skills: Array.isArray(user.skills) ? user.skills : [],
    linkedin: "",
    bio: "",
    experience: user.experience || "",
    careerJourney: "",
    connections: []
  };
}

function buildAlumniQuery(params) {
  const {
    search = "",
    graduationYear = "",
    industry = "",
    company = "",
    location = ""
  } = params;

  const query = {};

  if (search.trim()) {
    const exp = regex(search);
    query.$or = [
      { name: exp },
      { currentCompany: exp },
      { skills: exp },
      { industry: exp },
      { location: exp }
    ];
  }

  if (graduationYear) {
    const year = parseNumber(graduationYear);
    if (year) query.graduationYear = year;
  }

  if (industry.trim()) query.industry = regex(industry);
  if (company.trim()) query.currentCompany = regex(company);
  if (location.trim()) query.location = regex(location);

  return query;
}

async function resolveReceiverAlumniUser(id) {
  const alumniUser = await User.findOne({ _id: id, role: "alumni" }).select("name role email");
  if (alumniUser) {
    const linkedProfile = await Alumni.findOne({ userId: alumniUser._id }).select("_id userId email");
    return {
      receiver: alumniUser,
      targetAlumni: linkedProfile || null
    };
  }

  const targetAlumni = await Alumni.findById(id).select("_id userId email");
  if (!targetAlumni) {
    return { receiver: null, targetAlumni: null };
  }

  let receiver = null;
  if (targetAlumni.userId) {
    receiver = await User.findOne({ _id: targetAlumni.userId, role: "alumni" }).select("name role email");
  }

  if (!receiver && targetAlumni.email) {
    receiver = await User.findOne({ email: targetAlumni.email, role: "alumni" }).select("name role email");
  }

  return {
    receiver,
    targetAlumni
  };
}

function buildUserQuery(params) {
  const {
    search = "",
    industry = "",
    company = ""
  } = params;

  const query = { role: "alumni" };

  if (search.trim()) {
    const exp = regex(search);
    query.$or = [{ name: exp }, { company: exp }, { skills: exp }];
  }

  if (industry.trim()) {
    // User model has no dedicated industry field; map to company for best-effort filtering.
    query.company = regex(industry);
  }

  if (company.trim()) {
    query.company = regex(company);
  }

  return query;
}

async function getFilterOptionsFromAlumni() {
  const [graduationYears, industries, companies, locations] = await Promise.all([
    Alumni.distinct("graduationYear", { graduationYear: { $ne: null } }),
    Alumni.distinct("industry", { industry: { $nin: ["", null] } }),
    Alumni.distinct("currentCompany", { currentCompany: { $nin: ["", null] } }),
    Alumni.distinct("location", { location: { $nin: ["", null] } })
  ]);

  return {
    graduationYears: graduationYears.filter(Boolean).sort((a, b) => b - a),
    industries: industries.filter(Boolean).sort(),
    companies: companies.filter(Boolean).sort(),
    locations: locations.filter(Boolean).sort()
  };
}

async function getFilterOptionsFromUsers() {
  const companies = await User.distinct("company", {
    role: "alumni",
    company: { $nin: ["", null] }
  });

  return {
    graduationYears: [],
    industries: [],
    companies: companies.filter(Boolean).sort(),
    locations: []
  };
}

exports.getAllAlumni = async (req, res) => {
  try {
    const page = Math.max(parseNumber(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseNumber(req.query.limit) || 9, 1), 50);
    const skip = (page - 1) * limit;

    const [users, profiles] = await Promise.all([
      User.find({ role: "alumni" }).select("_id name email company experience skills createdAt"),
      Alumni.find({})
    ]);

    const profileByUserId = new Map();
    const profileByEmail = new Map();

    profiles.forEach((profile) => {
      if (profile.userId) {
        profileByUserId.set(String(profile.userId), profile);
      }
      if (profile.email) {
        profileByEmail.set(String(profile.email).toLowerCase(), profile);
      }
    });

    const merged = users.map((user) => {
      const base = normalizeUserDoc(user);
      const matchedProfile =
        profileByUserId.get(String(user._id)) ||
        profileByEmail.get(String(user.email || "").toLowerCase()) ||
        null;

      if (!matchedProfile) {
        return {
          ...base,
          createdAt: user.createdAt || null
        };
      }

      const profile = normalizeAlumniDoc(matchedProfile);

      return {
        _id: profile._id || base._id,
        receiverUserId: user._id,
        userId: user._id,
        name: profile.name || base.name,
        email: profile.email || base.email,
        profilePicture: profile.profilePicture || base.profilePicture,
        graduationYear: profile.graduationYear || base.graduationYear,
        degree: profile.degree || base.degree,
        currentCompany: profile.currentCompany || base.currentCompany,
        jobTitle: profile.jobTitle || base.jobTitle,
        industry: profile.industry || base.industry,
        location: profile.location || base.location,
        skills: (profile.skills && profile.skills.length > 0) ? profile.skills : base.skills,
        linkedin: profile.linkedin || base.linkedin,
        bio: profile.bio || base.bio,
        experience: profile.experience || base.experience,
        careerJourney: profile.careerJourney || base.careerJourney,
        connections: profile.connections || base.connections,
        createdAt: matchedProfile.createdAt || user.createdAt || null
      };
    });

    const currentUserId = String(req.user.id || "");
    const mergedWithoutSelf = merged.filter((item) => String(item.receiverUserId || item.userId || item._id) !== currentUserId);

    const availableFilters = {
      graduationYears: [...new Set(mergedWithoutSelf.map((x) => x.graduationYear).filter(Boolean))].sort((a, b) => b - a),
      industries: [...new Set(mergedWithoutSelf.map((x) => x.industry).filter(Boolean))].sort(),
      companies: [...new Set(mergedWithoutSelf.map((x) => x.currentCompany).filter(Boolean))].sort(),
      locations: [...new Set(mergedWithoutSelf.map((x) => x.location).filter(Boolean))].sort()
    };

    const search = asText(req.query.search).trim().toLowerCase();
    const graduationYear = parseNumber(req.query.graduationYear);
    const industry = asText(req.query.industry).trim().toLowerCase();
    const company = asText(req.query.company).trim().toLowerCase();
    const location = asText(req.query.location).trim().toLowerCase();

    const filtered = mergedWithoutSelf
      .filter((item) => {
        const searchable = [
          item.name,
          item.currentCompany,
          ...(item.skills || []),
          item.industry,
          item.location
        ]
          .map((x) => asText(x).toLowerCase())
          .join(" ");

        const matchesSearch = !search || searchable.includes(search);
        const matchesGradYear = !graduationYear || Number(item.graduationYear) === graduationYear;
        const matchesIndustry = !industry || asText(item.industry).toLowerCase().includes(industry);
        const matchesCompany = !company || asText(item.currentCompany).toLowerCase().includes(company);
        const matchesLocation = !location || asText(item.location).toLowerCase().includes(location);

        return matchesSearch && matchesGradYear && matchesIndustry && matchesCompany && matchesLocation;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const totalAlumni = filtered.length;
    const paged = filtered.slice(skip, skip + limit);

    return res.json({
      data: paged,
      totalAlumni,
      page,
      limit,
      totalPages: Math.max(Math.ceil(totalAlumni / limit), 1),
      availableFilters
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch alumni" });
  }
};

exports.searchAlumni = async (req, res) => {
  req.query = {
    ...req.query,
    search: req.query.query || req.query.search || ""
  };
  return exports.getAllAlumni(req, res);
};

exports.getAlumniById = async (req, res) => {
  try {
    const { id } = req.params;

    const alumniDoc = await Alumni.findById(id);
    if (alumniDoc) {
      return res.json(normalizeAlumniDoc(alumniDoc));
    }

    const alumniByUserId = await Alumni.findOne({ userId: id });
    if (alumniByUserId) {
      return res.json(normalizeAlumniDoc(alumniByUserId));
    }

    const user = await User.findOne({ _id: id, role: "alumni" }).select(
      "name email company experience skills"
    );

    if (user) {
      return res.json(normalizeUserDoc(user));
    }

    return res.status(404).json({ message: "Alumni profile not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch alumni profile" });
  }
};

exports.connectAlumni = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { id } = req.params;
    const note = (req.body.note || "").trim();

    const { receiver, targetAlumni } = await resolveReceiverAlumniUser(id);
    const receiverId = receiver?._id;

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot connect with yourself" });
    }

    const sender = await User.findById(senderId).select("name");

    if (!sender || !receiver || receiver.role !== "alumni") {
      return res.status(404).json({ message: "Alumni user not found" });
    }

    const content = note || `Hi ${receiver.name}, I would like to connect with you on AlumniConnect.`;

    const message = new Message({
      senderId,
      senderName: sender.name,
      recipientId: receiverId,
      recipientName: receiver.name,
      content
    });

    await message.save();

    await notificationController.createNotificationHelper(
      receiverId,
      "connect_request",
      `${sender.name} sent you a connection request.`,
      {
        fromUserId: senderId,
        fromUserName: sender.name
      }
    );

    if (targetAlumni) {
      await Alumni.findByIdAndUpdate(targetAlumni._id, { $addToSet: { connections: senderId } });
    }

    return res.status(201).json({ message: "Connection request sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to send connection request" });
  }
};

exports.offerCollaboration = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { id } = req.params;
    const collaborationType = (req.body.collaborationType || "").trim().toLowerCase();
    const note = (req.body.note || "").trim();

    if (!collaborationTypes.includes(collaborationType)) {
      return res.status(400).json({
        message: "Invalid collaboration type",
        allowed: collaborationTypes
      });
    }

    const { receiver } = await resolveReceiverAlumniUser(id);
    const receiverId = receiver?._id;

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot collaborate with yourself" });
    }

    const sender = await User.findById(senderId).select("name");

    if (!sender || !receiver || receiver.role !== "alumni") {
      return res.status(404).json({ message: "Alumni user not found" });
    }

    const messageBody = note
      ? `${note}\n\n[Collaboration Type: ${collaborationType}]`
      : `Hi ${receiver.name}, I want to discuss ${collaborationType}.`;

    const message = new Message({
      senderId,
      senderName: sender.name,
      recipientId: receiverId,
      recipientName: receiver.name,
      content: messageBody
    });

    await message.save();

    await notificationController.createNotificationHelper(
      receiverId,
      "collaboration_offer",
      `${sender.name} sent a ${collaborationType} request.`,
      {
        fromUserId: senderId,
        fromUserName: sender.name
      }
    );

    return res.status(201).json({ message: "Collaboration offer sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to send collaboration offer" });
  }
};

exports.getMyAlumniProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("name email company experience skills role");

    if (!user || user.role !== "alumni") {
      return res.status(404).json({ message: "Alumni user not found" });
    }

    let profile = await Alumni.findOne({ userId });

    if (!profile) {
      profile = await Alumni.create({
        userId,
        name: user.name,
        email: user.email,
        currentCompany: user.company || "",
        experience: user.experience || "",
        skills: Array.isArray(user.skills) ? user.skills : []
      });
    }

    return res.json(normalizeAlumniDoc(profile));
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch your alumni profile" });
  }
};

exports.updateMyAlumniProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("name email company experience skills role");

    if (!user || user.role !== "alumni") {
      return res.status(404).json({ message: "Alumni user not found" });
    }

    const alumniUpdates = {};
    const body = req.body || {};

    const hasField = (field) => Object.prototype.hasOwnProperty.call(body, field);

    if (hasField("name")) alumniUpdates.name = String(body.name || "").trim();
    if (hasField("email")) alumniUpdates.email = String(body.email || "").trim().toLowerCase();
    if (hasField("profilePicture")) alumniUpdates.profilePicture = String(body.profilePicture || "").trim();
    if (hasField("degree")) alumniUpdates.degree = String(body.degree || "").trim();
    if (hasField("currentCompany")) alumniUpdates.currentCompany = String(body.currentCompany || "").trim();
    if (hasField("jobTitle")) alumniUpdates.jobTitle = String(body.jobTitle || "").trim();
    if (hasField("industry")) alumniUpdates.industry = String(body.industry || "").trim();
    if (hasField("location")) alumniUpdates.location = String(body.location || "").trim();
    if (hasField("linkedin")) alumniUpdates.linkedin = String(body.linkedin || "").trim();
    if (hasField("bio")) alumniUpdates.bio = String(body.bio || "").trim();
    if (hasField("careerJourney")) alumniUpdates.careerJourney = String(body.careerJourney || "").trim();
    if (hasField("experience")) alumniUpdates.experience = body.experience;
    if (hasField("skills")) alumniUpdates.skills = parseSkills(body.skills);

    if (hasField("graduationYear")) {
      const gradYear = parseNumber(body.graduationYear);
      alumniUpdates.graduationYear = gradYear || null;
    }

    if (!alumniUpdates.name) alumniUpdates.name = user.name;
    if (!alumniUpdates.email) alumniUpdates.email = user.email;

    const profile = await Alumni.findOneAndUpdate(
      { userId },
      { $set: alumniUpdates },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    const userUpdates = {};
    if (hasField("name") && alumniUpdates.name) userUpdates.name = alumniUpdates.name;
    if (hasField("email") && alumniUpdates.email) userUpdates.email = alumniUpdates.email;
    if (hasField("currentCompany")) userUpdates.company = alumniUpdates.currentCompany;
    if (hasField("skills")) userUpdates.skills = alumniUpdates.skills;
    if (hasField("experience")) {
      const parsedExperience = Number(alumniUpdates.experience);
      userUpdates.experience = Number.isFinite(parsedExperience) ? parsedExperience : user.experience || 0;
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userUpdates }, { new: true });
    }

    return res.json({
      message: "Alumni profile updated successfully",
      data: normalizeAlumniDoc(profile)
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    return res.status(500).json({ message: error.message || "Failed to update alumni profile" });
  }
};

exports.uploadMyProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("role");

    if (!user || user.role !== "alumni") {
      return res.status(404).json({ message: "Alumni user not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const profilePicturePath = `/uploads/${req.file.filename}`;

    const profile = await Alumni.findOneAndUpdate(
      { userId },
      { $set: { profilePicture: profilePicturePath } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(201).json({
      message: "Profile picture uploaded successfully",
      profilePicture: profilePicturePath,
      data: normalizeAlumniDoc(profile)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to upload profile picture" });
  }
};
