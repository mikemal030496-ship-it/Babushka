
export interface LibraryCategory {
  category: string;
  icon: string;
  topics: string[];
}

export const LIBRARY_DATA: LibraryCategory[] = [
  {
    category: "Travel & Transit",
    icon: "✈️",
    topics: [
      "Airport Check-in", "Flight Vocabulary", "Train Station", "Asking for Directions",
      "Public Transport", "Car Rental", "Gas Station", "Border Crossing",
      "Taxis & Rideshare", "Cruises", "Hotels & Booking", "Youth Hostels",
      "Sightseeing", "Maps & Navigation", "Emergency Travel", "Luggage & Customs"
    ]
  },
  {
    category: "Food & Dining",
    icon: "🥘",
    topics: [
      "Restaurant Table", "Breakfast Foods", "Lunch Specials", "Dinner Menu",
      "Street Food", "Bakeries", "Coffee Shops", "Tea Ceremony",
      "Vegetables", "Fruits & Berries", "Meats & Poultry", "Seafood",
      "Dairy Products", "Spices & Herbs", "Desserts & Sweets", "Cooking Verbs",
      "Kitchen Tools", "Bars & Alcohol", "Traditional Dishes", "Dining Etiquette"
    ]
  },
  {
    category: "Daily Life",
    icon: "🏠",
    topics: [
      "Morning Routine", "Household Chores", "At Home", "Furniture",
      "Gardening", "Laundry", "Pet Care", "Internet & Tech",
      "Smartphones", "Banking & ATM", "Post Office", "Hairdresser",
      "Gym & Fitness", "Hobby Time", "Sleep & Nighttime", "Waste & Recycling"
    ]
  },
  {
    category: "Work & Education",
    icon: "💼",
    topics: [
      "Job Interview", "Office Life", "Meetings", "Computer Science",
      "Graphic Design", "Marketing", "Business Law", "Engineering",
      "Architecture", "Medicine", "University Life", "School Supplies",
      "Mathematics", "History Class", "Science Lab", "Literature",
      "Teaching", "Freelancing", "Salary & Taxes", "Career Planning"
    ]
  },
  {
    category: "Health & Body",
    icon: "🏥",
    topics: [
      "Doctor's Visit", "Pharmacy", "Anatomy", "Dentist",
      "Optical Care", "Mental Health", "Nutrition", "Yoga & Meditation",
      "First Aid", "Hospitals", "Diseases", "Symptoms",
      "Surgery", "Pregnancy", "Aging & Care", "Personal Hygiene"
    ]
  },
  {
    category: "Hobbies & Leisure",
    icon: "🎨",
    topics: [
      "Photography", "Painting", "Musical Instruments", "Concerts",
      "Cinema & Film", "Theatre", "Gaming", "Board Games",
      "Reading Books", "Writing", "Dancing", "Camping",
      "Fishing", "Hiking", "Skiing", "Chess"
    ]
  },
  {
    category: "Nature & Environment",
    icon: "🌲",
    topics: [
      "Forest Animals", "Ocean Life", "Birds", "Space & Planets",
      "Weather Phenomena", "Climate Change", "Geology", "Plants & Flowers",
      "National Parks", "The Solar System", "Farming", "Natural Disasters",
      "Ecology", "Renewable Energy", "Seasons", "Time of Day"
    ]
  },
  {
    category: "Society & Culture",
    icon: "🎭",
    topics: [
      "Russian Holidays", "Folklore", "Politics", "The Legal System",
      "Religion", "Philosophy", "Fashion", "Media & News",
      "Current Events", "Sports Teams", "Olympic Games", "Festivals",
      "Weddings", "Funerals", "Family Traditions", "City Landmarks"
    ]
  },
  {
    category: "Emotions & Interaction",
    icon: "❤️",
    topics: [
      "Expressing Love", "Arguments", "Apologizing", "Giving Compliments",
      "Describing Personality", "Physical Appearance", "Feelings", "Advice",
      "Small Talk", "Debating", "Formal Letters", "Texting Slang",
      "Common Idioms", "Swear Words", "Dating", "Workplace Politics"
    ]
  }
];
