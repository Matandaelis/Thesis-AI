
import { University } from "@/types";

export const PHRASE_BANK = {
  'Introduction': [
    "The primary objective of this study is to...",
    "This research aims to investigate...",
    "Recent developments in [field] have heightened the need for...",
    "This study addresses the gap in...",
    "The significance of this study lies in...",
  ],
  'Literature Review': [
    "Previous research has established that...",
    "Smith (2020) argues that...",
    "However, these studies fail to account for...",
    "A recurrent theme in the literature is...",
    "While there is consensus on X, Y remains controversial...",
  ],
  'Methodology': [
    "Data was collected using...",
    "The research design utilized a...",
    "Participants were recruited via...",
    "This approach was chosen because...",
    "To ensure reliability, the study employed...",
  ],
  'Results': [
    "As shown in Table 1, there is a significant...",
    "The results indicate that...",
    "Interestingly, the data suggests...",
    "Figure 2 illustrates the relationship between...",
    "Contrary to expectations, no correlation was found...",
  ],
  'Discussion': [
    "These findings suggest that...",
    "In contrast to earlier findings, this study...",
    "One possible explanation for this is...",
    "The implications of this are...",
    "It is plausible that these results reflect...",
  ],
  'Conclusion': [
    "In conclusion, this study has shown...",
    "Future research should focus on...",
    "The main contribution of this work is...",
    "Ideally, these findings should be replicated...",
    "Practitioners should consider..."
  ],
  'Critical Analysis': [
    "The evidence seems to indicate...",
    "This argument is flawed because...",
    "A limitation of this approach is...",
    "However, one must consider...",
  ]
};

export const KENYAN_UNIVERSITIES: University[] = [
  // 1. Moi University (MU)
  {
    id: 'moi',
    name: 'Moi University',
    logo: 'https://picsum.photos/100/100?random=1',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  // 2. Laikipia University (LU)
  {
    id: 'laikipia',
    name: 'Laikipia University',
    logo: 'https://picsum.photos/100/100?random=2',
    standards: { font: 'Times New Roman', size: '12', spacing: '1.5', citationStyle: 'APA 7th' }
  },
  // 3. Jomo Kenyatta University of Agriculture and Technology (JKUAT)
  {
    id: 'jkuat',
    name: 'Jomo Kenyatta Univ. (JKUAT)',
    logo: 'https://picsum.photos/100/100?random=3',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA/Harvard' }
  },
  // 4. Technical University of Kenya (TUK)
  {
    id: 'tuk',
    name: 'Technical University of Kenya',
    logo: 'https://picsum.photos/100/100?random=4',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  // 5. Egerton University
  {
    id: 'egerton',
    name: 'Egerton University',
    logo: 'https://picsum.photos/100/100?random=5',
    standards: { font: 'Times New Roman', size: '12', spacing: '1.5', citationStyle: 'APA 7th' }
  },
  // 6. University of Eldoret (UoE)
  {
    id: 'eldoret',
    name: 'University of Eldoret',
    logo: 'https://picsum.photos/100/100?random=6',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  // 7. Mount Kenya University (MKU)
  {
    id: 'mku',
    name: 'Mount Kenya University',
    logo: 'https://picsum.photos/100/100?random=7',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  // 8. Kenyatta University (KU)
  {
    id: 'ku',
    name: 'Kenyatta University',
    logo: 'https://picsum.photos/100/100?random=8',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  // 9. Chuka University
  {
    id: 'chuka',
    name: 'Chuka University',
    logo: 'https://picsum.photos/100/100?random=9',
    standards: { font: 'Times New Roman', size: '12', spacing: '1.5', citationStyle: 'APA 7th' }
  },
  // 10. University of Nairobi (UoN)
  {
    id: 'uon',
    name: 'University of Nairobi',
    logo: 'https://picsum.photos/100/100?random=10',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA/Harvard' }
  },
  // Other Major Universities
  {
    id: 'strath',
    name: 'Strathmore University',
    logo: 'https://picsum.photos/100/100?random=11',
    standards: { font: 'Times New Roman', size: '12', spacing: '1.5', citationStyle: 'APA 7th' }
  },
  {
    id: 'maseno',
    name: 'Maseno University',
    logo: 'https://picsum.photos/100/100?random=12',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'mmust',
    name: 'Masinde Muliro Univ. (MMUST)',
    logo: 'https://picsum.photos/100/100?random=13',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'usiu',
    name: 'USIU-Africa',
    logo: 'https://picsum.photos/100/100?random=14',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'daystar',
    name: 'Daystar University',
    logo: 'https://picsum.photos/100/100?random=15',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'cuea',
    name: 'Catholic University (CUEA)',
    logo: 'https://picsum.photos/100/100?random=16',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'tum',
    name: 'Technical University of Mombasa',
    logo: 'https://picsum.photos/100/100?random=17',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'kabarak',
    name: 'Kabarak University',
    logo: 'https://picsum.photos/100/100?random=18',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'kemu',
    name: 'Kenya Methodist University',
    logo: 'https://picsum.photos/100/100?random=19',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'kisii',
    name: 'Kisii University',
    logo: 'https://picsum.photos/100/100?random=20',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'kca',
    name: 'KCA University',
    logo: 'https://picsum.photos/100/100?random=21',
    standards: { font: 'Times New Roman', size: '12', spacing: '1.5', citationStyle: 'APA 7th' }
  },
  {
    id: 'riara',
    name: 'Riara University',
    logo: 'https://picsum.photos/100/100?random=22',
    standards: { font: 'Times New Roman', size: '12', spacing: '1.5', citationStyle: 'APA 7th' }
  },
  {
    id: 'spu',
    name: "St. Paul's University",
    logo: 'https://picsum.photos/100/100?random=23',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'anu',
    name: 'Africa Nazarene University',
    logo: 'https://picsum.photos/100/100?random=24',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'seku',
    name: 'South Eastern Kenya Univ.',
    logo: 'https://picsum.photos/100/100?random=25',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'meru',
    name: 'Meru Univ. of Science & Tech.',
    logo: 'https://picsum.photos/100/100?random=26',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'multimedia',
    name: 'Multimedia University',
    logo: 'https://picsum.photos/100/100?random=27',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'dedan',
    name: 'Dedan Kimathi University',
    logo: 'https://picsum.photos/100/100?random=28',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'pwani',
    name: 'Pwani University',
    logo: 'https://picsum.photos/100/100?random=29',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'karatina',
    name: 'Karatina University',
    logo: 'https://picsum.photos/100/100?random=30',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'maasai',
    name: 'Maasai Mara University',
    logo: 'https://picsum.photos/100/100?random=31',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'machakos',
    name: 'Machakos University',
    logo: 'https://picsum.photos/100/100?random=32',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'kirinyaga',
    name: 'Kirinyaga University',
    logo: 'https://picsum.photos/100/100?random=33',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'rongo',
    name: 'Rongo University',
    logo: 'https://picsum.photos/100/100?random=34',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'taita',
    name: 'Taita Taveta University',
    logo: 'https://picsum.photos/100/100?random=35',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'kibabii',
    name: 'Kibabii University',
    logo: 'https://picsum.photos/100/100?random=36',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'embu',
    name: 'University of Embu',
    logo: 'https://picsum.photos/100/100?random=37',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'garissa',
    name: 'Garissa University',
    logo: 'https://picsum.photos/100/100?random=38',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'zetech',
    name: 'Zetech University',
    logo: 'https://picsum.photos/100/100?random=39',
    standards: { font: 'Times New Roman', size: '12', spacing: '1.5', citationStyle: 'APA 7th' }
  },
  {
    id: 'gluk',
    name: 'Great Lakes Univ. (GLUK)',
    logo: 'https://picsum.photos/100/100?random=40',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  },
  {
    id: 'lukenya',
    name: 'Lukenya University',
    logo: 'https://picsum.photos/100/100?random=41',
    standards: { font: 'Times New Roman', size: '12', spacing: 'Double', citationStyle: 'APA 7th' }
  }
];
