const Note = require('../models/Note');
const Unit = require('../models/Unit');

// @desc   Upload a note (lecturer only, must belong to unit's department)
// @route  POST /api/notes/upload
const uploadNote = async (req, res) => {
  try {
    const { title, unit } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Verify the unit belongs to the lecturer's department
    const unitDoc = await Unit.findById(unit);
    if (!unitDoc) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    if (String(unitDoc.department) !== String(req.user.department)) {
      return res.status(403).json({ message: 'You can only upload notes for units in your department' });
    }

    const note = await Note.create({
      title,
      unit,
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
      filePath: req.file.filename,
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all notes for a specific unit
// @route  GET /api/notes/unit/:unitId
const getNotesByUnit = async (req, res) => {
  try {
    const notes = await Note.find({ unit: req.params.unitId }).populate('uploadedBy', 'name');
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadNote, getNotesByUnit };