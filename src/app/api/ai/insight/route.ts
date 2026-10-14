import { ApiError, ok, readJson, route } from '@/lib/api';
import { generateInsight } from '@/lib/ai/insight';
import { getCandidate, getCustomerFor } from '@/lib/data/repository';
import { exclusionReason, scorePair } from '@/lib/matching';
import { insightSchema } from '@/lib/validation';

export const POST = route(async (req, { user }) => {
  const { customerId, candidateId } = insightSchema.parse(await readJson(req));
  const customer = getCustomerFor(user.id, customerId);
  const candidate = getCandidate(candidateId);
  if (!customer || !candidate) throw new ApiError(404, 'NOT_FOUND', 'Client or candidate not found.');
  if (exclusionReason(customer, candidate)) throw new ApiError(422, 'NOT_ELIGIBLE', 'This pair is not an eligible match.');

  const insight = await generateInsight(user.name, customer, scorePair(customer, candidate));
  return ok(insight);
});
