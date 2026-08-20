// Ορίζουμε τι μορφή έχει ένα Σχόλιο
export interface AppComment {
  id: string;
  authorUid: string;
  text: string;
  createdAt: string;
  parentId?: string;
  helpfulBy?: string[]; // <--- ΝΕΟ: Ποιοι πάτησαν ότι τους βοήθησε
}

// Ορίζουμε τι μορφή έχει μια Εμπειρία
export interface Experience {
  id: string;
  title: string;
  body: string;
  emotion: string;
  createdAt: number | any;
  authorUid: string;
  matches: number;
  comments?: AppComment[];
}

// Ορίζουμε τι μορφή έχει μια Ειδοποίηση
export interface Notification {
  id: string;
  toUid: string;
  fromUid: string;
  type: 'comment' | 'reply' | 'help'; // <--- ΝΕΟ: Τύπος 'help'
  text: string;
  expId: string;
  read: boolean;
  createdAt: any;
}

export const SCREENS = {
  HOME: "HOME",
  CREATE: "CREATE",
  SEARCH: "SEARCH",
  SUPPORT: "SUPPORT",
  VIEW_EXPERIENCE: "VIEW_EXPERIENCE",
  PROFILE: "PROFILE",
  NOTIFICATIONS: "NOTIFICATIONS",
  SAFE_ZONE: "SAFE_ZONE"
};