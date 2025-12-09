export type LearnArticleSection = {
  heading: string;
  body: string;
  items?: string[];
};

export type LearnArticle = {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  eventTypeId?: string;
  summary: string;
  sections: LearnArticleSection[];
};

export const learnArticles: LearnArticle[] = [
  {
    id: 'imbeleko',
    title: 'Imbeleko Basics',
    subtitle: 'Child & Ancestor Introduction',
    category: 'Ceremony',
    eventTypeId: 'imbeleko',
    summary: 'Learn about the child and ancestor introduction ceremony',
    sections: [
      {
        heading: 'What is Imbeleko?',
        body: 'Imbeleko is a traditional Zulu ceremony that introduces a child to the ancestors and formally welcomes them into the family lineage. It establishes a spiritual connection between the child and their ancestors, ensuring protection and guidance throughout their life.',
      },
      {
        heading: 'Purpose',
        body: 'The ceremony establishes a spiritual connection between the child and their ancestors, ensuring protection and guidance throughout their life. It is a way of formally presenting the child to the family\'s ancestral spirits.',
      },
      {
        heading: 'Key Elements',
        body: 'The ceremony involves several important elements:',
        items: [
          'A goat or sheep is typically slaughtered as an offering',
          'An elder or traditional healer leads the ceremony',
          'Close family members gather at the homestead',
          'The child is presented to the ancestors with prayers',
          'The bile from the animal is used to bless the child',
        ],
      },
      {
        heading: 'When is it performed?',
        body: 'Imbeleko is usually performed when a child is still young, often within the first year of life. However, it can be done later if circumstances didn\'t allow for an earlier ceremony. Some families perform it when a child shows signs that the ancestors are calling.',
      },
      {
        heading: 'Planning Tips',
        body: 'When preparing for Imbeleko:',
        items: [
          'Consult with family elders about the appropriate date',
          'Arrange for a traditional healer or elder to lead',
          'Purchase a suitable goat or sheep',
          'Prepare the homestead and ritual space',
          'Notify close family members in advance',
        ],
      },
    ],
  },
  {
    id: 'family-introduction',
    title: 'Family Introduction Guide',
    subtitle: 'Ukucela / Ukumisa isizwe',
    category: 'Ceremony',
    eventTypeId: 'family_introduction',
    summary: 'Understanding Ukucela / Ukumisa isizwe',
    sections: [
      {
        heading: 'What is Family Introduction?',
        body: 'Family Introduction, known as Ukucela, Ukumisa isizwe, or Ukubona abakwamkhwenyana, is the formal process where a man\'s family visits the woman\'s family to officially express their intentions. This is typically the first formal step in the marriage process.',
      },
      {
        heading: 'Purpose',
        body: 'The purpose is to formally introduce the families to each other and to announce the man\'s intention to marry. It opens the door for lobola negotiations and establishes a respectful relationship between the two families.',
      },
      {
        heading: 'Key Elements',
        body: 'The family introduction typically involves:',
        items: [
          'A formal delegation from the man\'s family',
          'Respectful greetings and introductions',
          'Presentation of small gifts or tokens',
          'Expression of intent to pursue marriage',
          'Discussion of next steps (usually lobola)',
        ],
      },
      {
        heading: 'Who Attends?',
        body: 'The man\'s delegation typically includes his father, uncles, and respected elders. The woman\'s family receives them with her father, uncles, and other senior family members. The couple may or may not be present depending on family traditions.',
      },
      {
        heading: 'Planning Tips',
        body: 'When preparing for family introduction:',
        items: [
          'Choose respected family members as delegates',
          'Agree on a suitable date with the other family',
          'Prepare small gifts or tokens of respect',
          'Confirm the venue (usually the woman\'s home)',
          'Arrange transport for your delegation',
          'Prepare key points to discuss',
        ],
      },
    ],
  },
  {
    id: 'lobola',
    title: 'Lobola Overview',
    subtitle: 'Bridewealth Negotiation',
    category: 'Ceremony',
    eventTypeId: 'lobola',
    summary: 'The bridewealth negotiation process',
    sections: [
      {
        heading: 'What is Lobola?',
        body: 'Lobola is the traditional bridewealth negotiation between families, representing respect and appreciation for the bride and her family. It is a deeply rooted custom that symbolizes the union of two families, not just two individuals.',
      },
      {
        heading: 'The Process',
        body: 'The lobola negotiation follows a structured process:',
        items: [
          'Family representatives (abakhongi) are selected from the groom\'s side',
          'Formal negotiations take place at the bride\'s home',
          'Terms are discussed respectfully between the negotiators',
          'The bride\'s family states their expectations',
          'Negotiations continue until an agreement is reached',
          'Agreements are documented and both families are informed',
        ],
      },
      {
        heading: 'What is Negotiated?',
        body: 'Lobola traditionally involves cattle, but modern negotiations often include monetary equivalents. The amount varies by family, region, and circumstances. The bride\'s education, family status, and other factors may influence the discussion.',
      },
      {
        heading: 'Cultural Significance',
        body: 'Lobola is not a "purchase" of the bride. It represents gratitude to her family for raising her, and it creates a bond between the two families. It also demonstrates the groom\'s family\'s ability to care for their new daughter-in-law.',
      },
      {
        heading: 'Planning Tips',
        body: 'When preparing for lobola negotiations:',
        items: [
          'Choose experienced negotiators (abakhongi)',
          'Research what is customary in both families',
          'Prepare financially for various outcomes',
          'Approach negotiations with respect and patience',
          'Document all agreements in writing',
          'Plan for refreshments on negotiation days',
        ],
      },
    ],
  },
  {
    id: 'umembeso',
    title: 'Umembeso Guide',
    subtitle: 'Gift-Giving Ceremony',
    category: 'Ceremony',
    eventTypeId: 'umembeso',
    summary: 'Learn about the gift-giving ceremony and its significance',
    sections: [
      {
        heading: 'What is Umembeso?',
        body: 'Umembeso is a significant Zulu ceremony where the groom\'s family presents gifts to the bride\'s family. It represents the groom\'s appreciation and gratitude towards the bride\'s family for raising his future wife.',
      },
      {
        heading: 'When does it happen?',
        body: 'Umembeso typically takes place after lobola negotiations have been completed. It\'s one of the final steps before the traditional wedding (Umabo) can proceed. Some families choose to hold it a few weeks or months before the wedding.',
      },
      {
        heading: 'The Gift List',
        body: 'The gifts presented during Umembeso are carefully selected and carry deep meaning:',
        items: [
          'Izingubo (Blankets) – For the bride\'s mother, aunts, and female elders',
          'Izimpahla (Clothing) – Fabric, dresses, and traditional attire',
          'Izicathulo (Shoes) – For various family members',
          'Imali (Money) – Cash gifts for specific family members',
          'Groceries – Food items for the celebration',
        ],
      },
      {
        heading: 'The Ceremony Flow',
        body: 'The ceremony follows a traditional sequence:',
        items: [
          'Arrival – The groom\'s family arrives at the bride\'s homestead',
          'Formal greeting – A spokesperson announces their arrival and purpose',
          'Gift presentation – Gifts are presented one by one, often with singing',
          'Acceptance – The bride\'s family accepts and acknowledges the gifts',
          'Celebration – Food, singing, and dancing follow',
        ],
      },
      {
        heading: 'Planning Tips',
        body: 'When preparing for Umembeso:',
        items: [
          'Start gift shopping 2-3 months in advance',
          'Consult with elders on both sides about expectations',
          'Keep a detailed list of recipients and gifts',
          'Arrange transport for gifts and the delegation',
          'Coordinate catering for the celebration meal',
        ],
      },
      {
        heading: 'Cultural Significance',
        body: 'Umembeso strengthens the bond between two families. It shows the groom\'s family\'s commitment and their ability to care for their new daughter-in-law. The ceremony also allows both families to celebrate together before the wedding day.',
      },
    ],
  },
  {
    id: 'umbondo',
    title: 'Umbondo Guide',
    subtitle: 'Return Gifts from Bride\'s Family',
    category: 'Ceremony',
    eventTypeId: 'umbondo',
    summary: 'Return gifts from the bride\'s family',
    sections: [
      {
        heading: 'What is Umbondo?',
        body: 'Umbondo is the ceremony where the bride\'s family sends gifts to the groom\'s family. It represents the bride\'s family\'s contribution to the new union and their blessing for the couple. It is a reciprocal gesture following the lobola and umembeso.',
      },
      {
        heading: 'Purpose',
        body: 'Umbondo shows that the bride is not leaving her family empty-handed. It demonstrates that she comes from a family that values generosity and will support the new household. It also helps stock the couple\'s new home.',
      },
      {
        heading: 'What is included?',
        body: 'Umbondo typically includes:',
        items: [
          'Groceries in large quantities (rice, mealie meal, oil, etc.)',
          'Cleaning supplies and household items',
          'Kitchen utensils and cookware',
          'Bedding and linen',
          'Traditional grass mats (amacansi)',
        ],
      },
      {
        heading: 'When does it happen?',
        body: 'Umbondo usually takes place before the traditional wedding (Umabo), often a few days or weeks prior. The exact timing varies by family tradition and logistics.',
      },
      {
        heading: 'Planning Tips',
        body: 'When preparing for Umbondo:',
        items: [
          'Agree on the Umbondo date with the groom\'s family',
          'Draft a comprehensive grocery and gifts list',
          'Shop for groceries in bulk to save costs',
          'Arrange transport to the groom\'s family home',
          'Label packages for easier handover',
          'Confirm who will speak on behalf of the family',
        ],
      },
    ],
  },
  {
    id: 'umabo',
    title: 'Traditional Wedding (Umabo) Guide',
    subtitle: 'The Zulu Traditional Wedding',
    category: 'Wedding',
    eventTypeId: 'umabo',
    summary: 'Everything you need to know about the Zulu traditional wedding',
    sections: [
      {
        heading: 'What is Umabo?',
        body: 'Umabo is the traditional Zulu wedding ceremony, representing the formal union of two people and two families. It is a grand celebration that marks the culmination of the marriage process and the official welcoming of the bride into her new family.',
      },
      {
        heading: 'Key Rituals',
        body: 'Umabo involves several important rituals:',
        items: [
          'Ukwaba – The bride is officially given to the groom\'s family',
          'Ukusoka – The slaughter of a cow to welcome the bride',
          'Umabo gifts – The bride presents gifts to her new in-laws',
          'Umgonqo – The bride\'s seclusion period begins',
          'Traditional dances and celebrations',
        ],
      },
      {
        heading: 'The Bride\'s Role',
        body: 'The bride plays a central role in Umabo. She wears traditional Zulu attire, often including isidwaba (leather skirt) and other cultural garments. She presents gifts to her new family members and performs traditional dances.',
      },
      {
        heading: 'What to Prepare',
        body: 'When planning Umabo:',
        items: [
          'Book tents, chairs, and decor well in advance',
          'Arrange for livestock (cow) for the ceremony',
          'Coordinate catering for large guest numbers',
          'Hire a photographer and videographer',
          'Prepare traditional attire for the couple',
          'Create a program for the day\'s events',
          'Arrange transport for guests if needed',
        ],
      },
      {
        heading: 'Cultural Significance',
        body: 'Umabo is more than just a wedding; it is a sacred ritual that connects the bride to her new ancestors. The ceremony seeks blessings from both families\' ancestors for the couple\'s future together.',
      },
      {
        heading: 'Planning Tips',
        body: 'Tips for a successful Umabo:',
        items: [
          'Start planning at least 6 months in advance',
          'Involve elders from both families in planning',
          'Confirm the ceremony\'s order with a cultural advisor',
          'Prepare for varying weather with tent arrangements',
          'Have a detailed timeline for the day',
        ],
      },
    ],
  },
  {
    id: 'umemulo',
    title: 'Umemulo Guide',
    subtitle: 'Coming-of-Age Ceremony',
    category: 'Ceremony',
    eventTypeId: 'umemulo',
    summary: 'The coming-of-age ceremony explained',
    sections: [
      {
        heading: 'What is Umemulo?',
        body: 'Umemulo is a traditional Zulu coming-of-age ceremony for young women. It marks her transition into womanhood and signifies that she has reached a stage where she is ready for marriage. It is a celebration of purity, growth, and family pride.',
      },
      {
        heading: 'Purpose',
        body: 'The ceremony celebrates the young woman\'s journey to adulthood, acknowledges her family\'s successful upbringing, and introduces her to eligible suitors. It is also a spiritual ceremony that connects her to her ancestors.',
      },
      {
        heading: 'Key Elements',
        body: 'Umemulo typically includes:',
        items: [
          'A cow is slaughtered in the celebrant\'s honor',
          'The celebrant wears traditional attire and beadwork',
          'She receives gifts from family and guests',
          'Traditional songs and dances are performed',
          'Elders give blessings and advice',
          'A large feast is prepared for all guests',
        ],
      },
      {
        heading: 'Who Can Have Umemulo?',
        body: 'Traditionally, Umemulo is for young women who have maintained their virginity. It is typically held when she reaches her early twenties, though the exact age varies by family. Some families also hold the ceremony for young men.',
      },
      {
        heading: 'Planning Tips',
        body: 'When preparing for Umemulo:',
        items: [
          'Set the date well in advance (3-6 months)',
          'Arrange for the ceremonial cow',
          'Order or prepare traditional outfits for the celebrant',
          'Hire musicians or a traditional band',
          'Plan catering for a large number of guests',
          'Prepare a program including speeches and dances',
          'Invite family, friends, and community members',
        ],
      },
    ],
  },
  {
    id: 'funeral',
    title: 'Funeral Planning Basics',
    subtitle: 'Umngcwabo',
    category: 'Life Event',
    eventTypeId: 'funeral',
    summary: 'Understanding Umngcwabo traditions',
    sections: [
      {
        heading: 'Understanding Umngcwabo',
        body: 'Umngcwabo is the Zulu funeral ceremony, a time of mourning, remembrance, and spiritual transition. It is a deeply meaningful process that honors the deceased and helps guide their spirit to join the ancestors.',
      },
      {
        heading: 'Traditional Practices',
        body: 'Zulu funeral traditions often include:',
        items: [
          'Washing and dressing the body by family members',
          'Vigil (umlindelo) with singing and prayers',
          'Slaughter of a goat or cow to accompany the spirit',
          'Speeches and tributes from family and friends',
          'Burial at the family homestead or cemetery',
          'Post-funeral gathering and meal',
        ],
      },
      {
        heading: 'Mourning Period',
        body: 'After the funeral, the family observes a mourning period. Close relatives may wear black clothing and follow certain restrictions. The mourning period ends with a cleansing ceremony.',
      },
      {
        heading: 'Planning Considerations',
        body: 'When planning a funeral:',
        items: [
          'Contact a funeral parlour promptly',
          'Confirm the burial date with family and cemetery/homestead',
          'Coordinate with church or spiritual leaders',
          'Arrange tents, chairs, and seating',
          'Plan catering for the post-funeral meal',
          'Organize transport for family and the hearse',
          'Print funeral programs',
        ],
      },
      {
        heading: 'Spiritual Significance',
        body: 'The funeral is not just about saying goodbye; it is about helping the deceased transition to become an ancestor who will watch over and guide the living family members.',
      },
    ],
  },
  {
    id: 'ancestral-rituals',
    title: 'Ancestral Rituals Overview',
    subtitle: 'Rituals, Cleansing & Consultations',
    category: 'Spiritual',
    eventTypeId: 'ancestral_ritual',
    summary: 'Rituals, cleansing, and spiritual consultations',
    sections: [
      {
        heading: 'What are Ancestral Rituals?',
        body: 'Ancestral rituals are ceremonies performed to communicate with, honor, and seek guidance from the ancestors (amadlozi). They are central to Zulu spiritual practice and are conducted for various purposes including thanks, healing, and seeking blessings.',
      },
      {
        heading: 'Types of Rituals',
        body: 'There are various types of ancestral rituals:',
        items: [
          'Ukuphahla – Speaking to ancestors, usually with traditional beer',
          'Ukubuyisa – Bringing back the spirit of a deceased family member',
          'Ukuhlanza – Cleansing rituals to remove bad luck or spirits',
          'Ukuthwasa – Initiation process for traditional healers',
          'Thanksgiving rituals – Giving thanks for blessings received',
        ],
      },
      {
        heading: 'When are they performed?',
        body: 'Ancestral rituals may be performed for various reasons: after dreams or visions, when experiencing problems, before major life events, to give thanks, or when guided by a traditional healer. The timing is often determined by consultation with elders or healers.',
      },
      {
        heading: 'Key Elements',
        body: 'Common elements in ancestral rituals include:',
        items: [
          'Traditional beer (utshwala)',
          'Burning of impepho (incense plant)',
          'Animal sacrifice (usually goat or chicken)',
          'Prayers and speaking to ancestors',
          'Participation of family elders',
          'Guidance from a traditional healer (sangoma or inyanga)',
        ],
      },
      {
        heading: 'Planning Tips',
        body: 'When preparing for an ancestral ritual:',
        items: [
          'Consult with a traditional healer to identify the purpose',
          'Choose an appropriate date (often significant dates)',
          'Purchase required items (animal, herbs, beer, etc.)',
          'Notify participating family members',
          'Prepare the ritual space at the homestead',
          'Fast or follow any prescribed preparations',
        ],
      },
    ],
  },
  {
    id: 'combining-ceremonies',
    title: 'Combining Ceremonies',
    subtitle: 'Blending Church & Traditional',
    category: 'Guide',
    summary: 'Respectfully combining church and traditional ceremonies',
    sections: [
      {
        heading: 'Why Combine Ceremonies?',
        body: 'Many families today practice both Christianity and traditional Zulu customs. Combining church and traditional ceremonies allows couples and families to honor both their faith and their cultural heritage.',
      },
      {
        heading: 'Common Combinations',
        body: 'Popular ways to combine ceremonies include:',
        items: [
          'Church wedding on Saturday, Umabo on Sunday or following weekend',
          'Morning church service followed by traditional celebrations',
          'Separate events for church and traditional ceremonies',
          'Incorporating prayer into traditional ceremonies',
        ],
      },
      {
        heading: 'Considerations',
        body: 'When planning combined ceremonies, consider:',
        items: [
          'Family expectations from both sides',
          'Church requirements and restrictions',
          'Timing and logistics between venues',
          'Budget implications of multiple events',
          'Guest travel and accommodation',
          'Order of ceremonies (which comes first)',
        ],
      },
      {
        heading: 'Respectful Blending',
        body: 'The key to combining ceremonies is respect. Ensure that neither tradition is diminished or rushed. Give each ceremony its proper time and attention, and involve elders and church leaders in planning.',
      },
      {
        heading: 'Planning Tips',
        body: 'Tips for successful combined ceremonies:',
        items: [
          'Communicate clearly with both families about the plan',
          'Consult with your pastor and family elders',
          'Create a detailed timeline that honors both traditions',
          'Budget for both celebrations',
          'Consider guest fatigue if events are close together',
          'Hire coordinators who understand both traditions',
        ],
      },
    ],
  },
];

export function getArticleById(id: string): LearnArticle | undefined {
  return learnArticles.find((article) => article.id === id);
}

export function getArticleByEventType(eventTypeId: string): LearnArticle | undefined {
  return learnArticles.find((article) => article.eventTypeId === eventTypeId);
}
