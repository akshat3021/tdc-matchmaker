import { ApiError, ok, route } from '@/lib/api';
import { getCustomerFor, listCandidates } from '@/lib/data/repository';
import { matchProfileFor, rankMatches } from '@/lib/matching';
import { matchesQuerySchema } from '@/lib/validation';
import type { Gender } from '@/types';

/** Contact details never leave the server for pool candidates. */
function publicView<T extends { email: string; phone: string }>(p: T): Omit<T, 'email' | 'phone'> {
  const { email: _email, phone: _phone, ...rest } = p;
  return rest;
}

export const GET = route(async (req, { user, params }) => {
  const customer = getCustomerFor(user.id, params.id);
  if (!customer) throw new ApiError(404, 'NOT_FOUND', 'Client not found.');

  const { limit } = matchesQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const oppositeGender: Gender = customer.gender === 'Male' ? 'Female' : 'Male';
  const pool = listCandidates(oppositeGender);
  const matches = rankMatches(customer, pool, { limit });
  const profile = matchProfileFor(customer.gender);

  return ok({
    poolSize: pool.length,
    logic: { id: profile.id, description: profile.description, weights: profile.factors.map((f) => ({ label: f.label, weight: f.weight })) },
    matches: matches.map((m) => ({ ...m, candidate: publicView(m.candidate) })),
  });
});
