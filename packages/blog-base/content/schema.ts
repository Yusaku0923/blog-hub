import { z } from '@nuxt/content'

// Always import `z` from '@nuxt/content' (re-exports its bundled zod).
// Importing from 'zod' directly picks a different instance that
// @nuxt/content's schema-vendor detection won't recognize.
//
// title/description bounds match PetGurashi's existing constraints
// (target title = 32-40 chars, description = 80-120 chars in JP).

export const baseSchema = z.object({
  title:       z.string().min(10).max(40),
  description: z.string().min(40).max(140),
  tags:        z.array(z.string()).default([]),
  date:        z.coerce.date(),
  created:     z.coerce.date(),
  listed:      z.boolean().default(true),
  toc:         z.boolean().default(true),
  draft:       z.boolean().default(false),
  pageType:    z.enum(['article', 'category']).default('article'),
  heroImage:   z.string().optional(),
})
