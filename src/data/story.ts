/**
 * Our Story content. The history, founders and journey come only from the owner.
 * A chapter with `body: null` is hidden; titles are working titles until the owner confirms them.
 */
import type { StoryContent } from './types.ts';

export const story: StoryContent = {
  intro: null,
  chapters: [
    { id: 'origin', number: '01', title: 'Origin', titleIsWorking: true, body: null, image: 'story-origin' },
    {
      id: 'sri-lankan-roots',
      number: '02',
      title: 'Sri Lankan Roots',
      titleIsWorking: true,
      body: null,
      // Chapter 02 shows the logo plaque in an espresso arch (design decision, D3).
    },
    { id: 'our-kitchen', number: '03', title: 'Our Kitchen', titleIsWorking: true, body: null, image: 'story-kitchen' },
    {
      id: 'canadian-journey',
      number: '04',
      title: 'Canadian Journey',
      titleIsWorking: true,
      body: null,
      image: 'story-canadian-journey',
    },
  ],
};
