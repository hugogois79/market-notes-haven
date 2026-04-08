
import { Note } from "@/types";

// Load all notes from localStorage
export const loadNotes = (): Note[] => {
  try {
    const storedNotes = localStorage.getItem("notes");
    if (!storedNotes) return [];
    
    const parsedNotes = JSON.parse(storedNotes);
    
    // Convert string dates back to Date objects
    return parsedNotes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  } catch (error) {
    console.error("Error loading notes:", error);
    return [];
  }
};

// Save all notes to localStorage
export const saveNotes = (notes: Note[]): void => {
  try {
    localStorage.setItem("notes", JSON.stringify(notes));
  } catch (error) {
    console.error("Error saving notes:", error);
  }
};

// Get a note by id
export const getNoteById = (noteId: string): Note | undefined => {
  const notes = loadNotes();
  return notes.find((note) => note.id === noteId);
};

// Create a new empty note
export const createEmptyNote = (): Note => ({
  id: Date.now().toString(),
  title: "Untitled Note",
  content: "",
  tags: [],
  category: "General",
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Create a new TAO-related note
export const createTaoNote = (validatorName?: string): Note => ({
  id: Date.now().toString(),
  title: validatorName ? `${validatorName} Note` : "Untitled TAO Note",
  content: "",
  tags: ["TAO"],
  category: "TAO",
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Search notes by query
export const searchNotes = (notes: Note[], query: string): Note[] => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return notes;
  
  return notes.filter((note) => {
    return (
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
      note.category.toLowerCase().includes(searchTerm)
    );
  });
};

// Filter notes by category
export const filterNotesByCategory = (notes: Note[], category: string): Note[] => {
  if (!category || category === "All") return notes;
  return notes.filter((note) => note.category === category);
};

// Filter notes by tags
export const filterNotesByTags = (notes: Note[], tags: string[]): Note[] => {
  if (!tags.length) return notes;
  return notes.filter((note) => {
    return tags.some((tag) => note.tags.includes(tag));
  });
};

// Filter notes by token
export const filterNotesByToken = (notes: Note[], tokenSymbol: string): Note[] => {
  if (!tokenSymbol) return notes;
  return notes.filter((note) => note.tags.includes(tokenSymbol));
};

// Get TAO-related notes
export const getTaoNotes = (notes: Note[]): Note[] => {
  return notes.filter((note) => note.tags.includes("TAO") || note.category === "TAO");
};

// Get all unique categories from notes
export const getAllCategories = (notes: Note[]): string[] => {
  const categories = notes.map((note) => note.category);
  return Array.from(new Set(categories));
};

// Get all unique tags from notes
export const getAllTags = (notes: Note[]): string[] => {
  const tags = notes.flatMap((note) => note.tags);
  return Array.from(new Set(tags));
};
