const LiveClass = require('../models/LiveClass');
const Unit = require('../models/Unit');

// @desc   Start a live class (lecturer only)
// @route  POST /api/liveclass/start
const startLiveClass = async (req, res) => {
  try {
    const { unit } = req.body;

    const unitDoc = await Unit.findById(unit);
    if (!unitDoc) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    if (String(unitDoc.department) !== String(req.user.department)) {
      return res.status(403).json({ message: 'You can only start live classes for units in your department' });
    }

    await LiveClass.updateMany(
      { unit, isActive: true },
      { isActive: false, endedAt: new Date() }
    );

    const roomName = `educore-${unitDoc.code.replace(/\s+/g, '')}-${Date.now()}`;

    const liveClass = await LiveClass.create({
      unit,
      startedBy: req.user._id,
      roomName,
      isActive: true,
    });

    res.status(201).json(liveClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Check if a unit has an active live class
// @route  GET /api/liveclass/status/:unitId
const getLiveClassStatus = async (req, res) => {
  try {
    const liveClass = await LiveClass.findOne({ unit: req.params.unitId, isActive: true });
    res.status(200).json({ isActive: !!liveClass, liveClass: liveClass || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   End a live class (lecturer only)
// @route  POST /api/liveclass/end/:unitId
const endLiveClass = async (req, res) => {
  try {
    await LiveClass.updateMany(
      { unit: req.params.unitId, isActive: true },
      { isActive: false, endedAt: new Date() }
    );
    res.status(200).json({ message: 'Live class ended' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all past (ended) live class sessions for a unit
// @route  GET /api/liveclass/history/:unitId
const getLiveClassHistory = async (req, res) => {
  try {
    const sessions = await LiveClass.find({ unit: req.params.unitId, isActive: false })
      .sort({ startedAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startLiveClass, getLiveClassStatus, endLiveClass, getLiveClassHistory };