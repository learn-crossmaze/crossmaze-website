// Each occasion's symbols for the card maker (src/greetings/maker.ts), by occasion id.
import type { Kit } from '../maker';
import { festivalKitsA } from './festivals-a';
import { festivalKitsB } from './festivals-b';
import { nationalKits } from './national';
import { schoolKitsA } from './school-a';
import { schoolKitsB } from './school-b';

export const kits: Record<string, Kit> = { ...nationalKits, ...schoolKitsA, ...schoolKitsB, ...festivalKitsA, ...festivalKitsB };
