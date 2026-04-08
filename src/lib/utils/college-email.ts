/**
 * Checks whether the email belongs to the IIEST Shibpur domain.
 */
export function isCollegeEmail(email: string): boolean {
  return (
    email.endsWith("@students.iiests.ac.in") ||
    email.endsWith(".iiests.ac.in")
  );
}
