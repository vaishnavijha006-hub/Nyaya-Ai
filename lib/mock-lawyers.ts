export interface Lawyer {
  id: string;
  name: string;
  specialties: string[];
  languages: string[];
  experienceYears: number;
  location: string;
  bio: string;
  avatarUrl: string;
  verified: boolean;
  rating: number;
  casesWon: number;
}

export const MOCK_LAWYERS: Lawyer[] = [
  {
    id: 'l1',
    name: 'Adv. Rajesh Sharma',
    specialties: ['Criminal Law', 'Family Law'],
    languages: ['English', 'Hindi', 'Punjabi'],
    experienceYears: 15,
    location: 'Delhi',
    bio: 'Experienced in high-profile criminal defense and complex family disputes across the NCR region.',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    verified: true,
    rating: 4.8,
    casesWon: 342,
  },
  {
    id: 'l2',
    name: 'Adv. Priya Deshmukh',
    specialties: ['Corporate Law', 'Property Disputes'],
    languages: ['English', 'Marathi', 'Hindi'],
    experienceYears: 8,
    location: 'Mumbai',
    bio: 'Specializing in real estate transactions, property disputes, and corporate compliance for startups.',
    avatarUrl: 'https://i.pravatar.cc/150?u=a04258a2462d826712d',
    verified: true,
    rating: 4.9,
    casesWon: 128,
  },
  {
    id: 'l3',
    name: 'Adv. Arun Kumar',
    specialties: ['Civil Rights', 'Public Interest Litigation (PIL)'],
    languages: ['English', 'Tamil', 'Telugu'],
    experienceYears: 20,
    location: 'Chennai',
    bio: 'Passionate human rights advocate and frequent litigator in the Madras High Court.',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    verified: true,
    rating: 4.7,
    casesWon: 450,
  },
  {
    id: 'l4',
    name: 'Adv. Neha Gupta',
    specialties: ['Cyber Law', 'Intellectual Property'],
    languages: ['English', 'Hindi', 'Bengali'],
    experienceYears: 6,
    location: 'Bangalore',
    bio: 'Tech-savvy lawyer dealing with data privacy, cybercrimes, and trademark registration.',
    avatarUrl: 'https://i.pravatar.cc/150?u=a048581f4e29026701d',
    verified: true,
    rating: 4.6,
    casesWon: 85,
  },
  {
    id: 'l5',
    name: 'Adv. Vikram Singh',
    specialties: ['Taxation', 'Corporate Law'],
    languages: ['English', 'Hindi', 'Gujarati'],
    experienceYears: 12,
    location: 'Ahmedabad',
    bio: 'Expert in GST compliance, income tax appeals, and corporate restructuring.',
    avatarUrl: 'https://i.pravatar.cc/150?u=a04258114e29026302d',
    verified: true,
    rating: 4.5,
    casesWon: 210,
  },
  {
    id: 'l6',
    name: 'Adv. Meera Reddy',
    specialties: ['Family Law', 'Domestic Violence'],
    languages: ['English', 'Telugu', 'Hindi'],
    experienceYears: 10,
    location: 'Hyderabad',
    bio: 'Compassionate advocate focused on women’s rights, divorce settlements, and child custody.',
    avatarUrl: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
    verified: true,
    rating: 4.9,
    casesWon: 175,
  }
];

export const CITIES = Array.from(new Set(MOCK_LAWYERS.map((l) => l.location))).sort();
export const SPECIALTIES = Array.from(new Set(MOCK_LAWYERS.flatMap((l) => l.specialties))).sort();
