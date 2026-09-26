/**
 * Missing-facts report and data validation.
 *
 * - "Missing" items never fail the build: the site simply hides them.
 * - "Errors" (broken data such as duplicate ids) fail the build.
 *
 * Pure TypeScript with no Astro imports, so `scripts/missing-facts.ts` can run it with Node.
 */
import { copy } from './copy.ts';
import { menu } from './menu.ts';
import { photos } from './photos.ts';
import { restaurant } from './restaurant.ts';
import { story } from './story.ts';
import type { Weekday } from './types.ts';

export interface ReportSection {
  title: string;
  lines: string[];
}

export interface DataReport {
  errors: string[];
  sections: ReportSection[];
  summary: { missingFacts: number; questions: number; drafts: number; photosNeeded: number; photosTotal: number };
}

const WEEKDAYS: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function buildReport(options: { photoFileExists?: (file: string) => boolean } = {}): DataReport {
  const errors: string[] = [];

  // --- Business facts ---
  const facts: string[] = [];
  if (!restaurant.address) facts.push('Address');
  if (!restaurant.phone) facts.push('Phone number');
  if (!restaurant.email) facts.push('Email address');
  const missingDays = WEEKDAYS.filter((day) => restaurant.hours[day] === null);
  if (missingDays.length === WEEKDAYS.length) facts.push('Opening hours (all 7 days)');
  else if (missingDays.length) facts.push(`Opening hours for ${missingDays.join(', ')}`);
  if (!restaurant.ordering.url) facts.push('Online ordering URL');
  if (!restaurant.ordering.platformName) facts.push('Ordering platform name');
  if (!restaurant.social.length) facts.push('Social media links');
  if (!restaurant.domain) facts.push('Website domain');
  if (restaurant.acceptsReservations === null) facts.push('Whether reservations are accepted');

  for (const day of WEEKDAYS) {
    for (const period of restaurant.hours[day] ?? []) {
      if (!TIME.test(period.opens) || !TIME.test(period.closes)) {
        errors.push(`Hours for ${day} must be 24-hour HH:MM (got ${period.opens}–${period.closes}).`);
      }
    }
  }
  if (restaurant.ordering.url && !/^https:\/\//.test(restaurant.ordering.url)) {
    errors.push('Ordering URL must start with https://');
  }

  // --- Menu ---
  const questions: string[] = [];
  const categoryIds = new Set<string>();
  const itemIds = new Set<string>();
  let items = 0;
  let unpriced = 0;

  for (const category of menu) {
    if (categoryIds.has(category.id)) errors.push(`Duplicate category id "${category.id}".`);
    categoryIds.add(category.id);
    for (const note of category.confirm ?? []) questions.push(`${category.name}: ${note}`);
    if (category.image && !photos[category.image]) errors.push(`Category "${category.id}" uses unknown photo "${category.image}".`);
    if (category.items.filter((item) => item.featured).length > 1) {
      errors.push(`Category "${category.id}" has more than one featured item.`);
    }

    for (const item of category.items) {
      items += 1;
      if (itemIds.has(item.id)) errors.push(`Duplicate menu item id "${item.id}".`);
      itemIds.add(item.id);
      if (!item.name.trim()) errors.push(`Menu item "${item.id}" has no name.`);
      if (item.image && !photos[item.image]) errors.push(`Menu item "${item.id}" uses unknown photo "${item.image}".`);
      if (item.price === null) unpriced += 1;
      for (const note of item.confirm ?? []) {
        const line = `${item.name}: ${note}`;
        if (!questions.includes(line)) questions.push(line);
      }
    }
  }
  if (unpriced) facts.push(`Prices for ${unpriced} of ${items} menu items`);

  // --- Story ---
  if (!story.intro) facts.push('Our Story introduction');
  for (const chapter of story.chapters) {
    if (!chapter.body) facts.push(`Our Story chapter ${chapter.number} "${chapter.title}"`);
    if (chapter.titleIsWorking) questions.push(`Our Story chapter ${chapter.number}: keep the working title "${chapter.title}"?`);
  }

  // --- Copy ---
  const drafts = Object.values(copy)
    .filter((line) => line.source === 'draft')
    .map((line) => `"${line.text}" (${line.usedIn})`);

  // --- Photos ---
  const photoEntries = Object.entries(photos);
  const needed = photoEntries.filter(([, entry]) => entry.file === null).map(([key]) => key);
  if (options.photoFileExists) {
    for (const [key, entry] of photoEntries) {
      if (entry.file && !options.photoFileExists(entry.file)) {
        errors.push(`Photo "${key}" points to "${entry.file}", which is not in src/assets/photos/.`);
      }
    }
  }

  const sections: ReportSection[] = [
    { title: 'Business facts to supply', lines: facts },
    { title: 'Questions for the owner', lines: questions },
    { title: 'Draft copy awaiting approval', lines: drafts },
    {
      title: 'Photography',
      lines: needed.length ? [`${needed.length} of ${photoEntries.length} photo slots still use the placeholder.`] : [],
    },
  ];

  return {
    errors,
    sections,
    summary: {
      missingFacts: facts.length,
      questions: questions.length,
      drafts: drafts.length,
      photosNeeded: needed.length,
      photosTotal: photoEntries.length,
    },
  };
}

export function formatReport(report: DataReport): string {
  const out: string[] = ['# Ceylontro Kitchen — missing facts report', ''];
  if (report.errors.length) {
    out.push('## Data errors (fix before deploying)', '', ...report.errors.map((line) => `- ${line}`), '');
  }
  for (const section of report.sections) {
    out.push(`## ${section.title}`, '');
    out.push(...(section.lines.length ? section.lines.map((line) => `- [ ] ${line}`) : ['- Nothing outstanding.']), '');
  }
  const s = report.summary;
  out.push(
    `Summary: ${s.missingFacts} facts missing · ${s.questions} questions · ${s.drafts} draft lines · ` +
      `${s.photosNeeded}/${s.photosTotal} photos needed · ${report.errors.length} data errors.`,
  );
  return out.join('\n');
}
