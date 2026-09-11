// @ts-check
import { defineConfig } from 'astro/config';

const base = process.env.ASTRO_BASE ?? '/';
const site = process.env.ASTRO_SITE ?? 'https://hrproduction.id';

// https://astro.build/config
export default defineConfig({
	site,
	base,
});
