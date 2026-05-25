Update the ceremony tiles section in `src/pages/onboarding/OnboardingLanguage.tsx` to reflect pan-cultural support across all South African cultures.

### Changes

1. **Heading / subheading** (lines 717-720):
   - Change section label from `"Ceremonies"` to `"Ceremonies we support"`
   - Change H2 from `"Built for the moments that matter most"` to `"Ceremonies we support"`
   - Change subheading from `"Supporting the ceremonies your family treasures."` to `"Supporting families across all South African cultures and provinces."`

2. **Ceremony tiles grid** (lines 722-727):
   - Update grid class from `grid sm:grid-cols-2 gap-5` to `grid sm:grid-cols-2 lg:grid-cols-3 gap-5`
   - Replace the 4 existing `<CeremonyTile />` entries with 6 new pan-cultural tiles:
     - Lobola (🤝)
     - Umembeso (🎁)
     - Umemulo (🌸)
     - Ulwaluko (🌿)
     - Domba (🐍)
     - Lebollo (🔥)
   - Each tile gets updated `name`, `description`, `categories`, `accentClass="bg-primary"`, and `icon` props.

3. **"Also supporting" pills** (lines 730-743):
   - Replace the 3 existing pill entries with 6:
     - Umabo (👰)
     - Umbondo (🧺)
     - Imbeleko (👶)
     - Ancestral Ritual (🙏)
     - Tshikanda (🌀)
     - Intonjane (📿)
   - Keep the section label `"Also supporting"` and styling unchanged.

No other changes to the file.