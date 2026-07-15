const Attendance = require('../models/Attendance');
const LiveClass = require('../models/LiveClass');

// @desc   Student responds to an attendance prompt
// @route  POST /api/attendance/respond
const respondToPrompt = async (req, res) => {
  try {
    const { liveClassId, promptIndex } = req.body;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass || !liveClass.isActive) {
      return res.status(400).json({ message: 'This live class is not active' });
    }

    let attendance = await Attendance.findOne({
      liveClass: liveClassId,
      student: req.user._id,
    });

    if (!attendance) {
      attendance = await Attendance.create({
        liveClass: liveClassId,
        student: req.user._id,
        respondedPrompts: [promptIndex],
      });
    } else {
      if (!attendance.respondedPrompts.includes(promptIndex)) {
        attendance.respondedPrompts.push(promptIndex);
        await attendance.save();
      }
    }

    res.status(200).json({ message: 'Attendance recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Lecturer increments the prompt count (called every 5 minutes during class)
// @route  POST /api/attendance/increment-prompt/:liveClassId
const incrementPrompt = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.liveClassId);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class not found' });
    }

    liveClass.totalPrompts += 1;
    await liveClass.save();

    res.status(200).json({ totalPrompts: liveClass.totalPrompts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   End live class and calculate final attendance statuses
// @route  POST /api/attendance/finalize/:liveClassId
const finalizeAttendance = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.liveClassId);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class not found' });
    }

    const totalPrompts = liveClass.totalPrompts;
    const records = await Attendance.find({ liveClass: liveClass._id });

    for (const record of records) {
      const responded = record.respondedPrompts.length;

      if (totalPrompts === 0) {
        record.status = 'not attended';
      } else if (responded >= totalPrompts) {
        record.status = 'fully attended';
      } else if (responded > 0) {
        record.status = 'partially attended';
      } else {
        record.status = 'not attended';
      }

      await record.save();
    }

    liveClass.isActive = false;
    liveClass.endedAt = new Date();
    await liveClass.save();

    res.status(200).json({ message: 'Class ended and attendance finalized' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get attendance report for a live class (lecturer only)
// @route  GET /api/attendance/report/:liveClassId
const getAttendanceReport = async (req, res) => {
  try {
    const records = await Attendance.find({ liveClass: req.params.liveClassId }).populate(
      'student',
      'name admissionNumber'
    );
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { respondToPrompt, incrementPrompt, finalizeAttendance, getAttendanceReport };