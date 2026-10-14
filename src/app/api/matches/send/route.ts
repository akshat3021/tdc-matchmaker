import { ApiError, ok, readJson, route } from '@/lib/api';
import { calcAge, formatHeight, formatIncome, fullName } from '@/lib/format';
import { getCandidate, getCustomerFor } from '@/lib/data/repository';
import { sendMatchEmail } from '@/lib/mail';
import { exclusionReason } from '@/lib/matching';
import { sendMatchSchema } from '@/lib/validation';

export const POST = route(async (req, { user }) => {
  const { customerId, candidateId, message } = sendMatchSchema.parse(await readJson(req));
  const customer = getCustomerFor(user.id, customerId);
  const candidate = getCandidate(candidateId);
  if (!customer || !candidate) throw new ApiError(404, 'NOT_FOUND', 'Client or candidate not found.');
  if (exclusionReason(customer, candidate)) throw new ApiError(422, 'NOT_ELIGIBLE', 'This pair is not an eligible match.');

  // Basic profile snapshot appended under the matchmaker's note. No contact details.
  const snapshot = [
    '— Profile snapshot —',
    `${candidate.firstName}, ${calcAge(candidate.dateOfBirth)} · ${candidate.city}, ${candidate.country}`,
    `${candidate.designation}, ${candidate.company}`,
    `${candidate.degree}, ${candidate.college} · ${formatIncome(candidate.incomeLpa)}`,
    `${formatHeight(candidate.heightCm)} · ${candidate.religion}, ${candidate.caste}`,
    `Languages: ${candidate.languages.join(', ')}`,
  ].join('\n');

  const receipt = await sendMatchEmail({
    to: customer.email,
    subject: `An introduction from The Date Crew: ${candidate.firstName}`,
    body: `${message}\n\n${snapshot}`,
  });

  return ok({ receipt, candidate: { id: candidate.id, name: fullName(candidate) } });
});
