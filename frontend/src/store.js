const STORAGE_KEY = 'notes-cache';

export const loadNotes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load notes from storage', err);
    return [];
  }
};

export const saveNotes = (notes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes to storage', err);
  }
};

export const upsertNote = (note) => {
  const notes = loadNotes();
  const idx = notes.findIndex((n) => n.noteId === note.noteId);
  if (idx >= 0) {
    notes[idx] = note;
  } else {
    notes.push(note);
  }
  saveNotes(notes);
  return notes;
};

export const deleteNoteLocal = (noteId) => {
  const notes = loadNotes().filter((n) => n.noteId !== noteId);
  saveNotes(notes);
  return notes;
};

