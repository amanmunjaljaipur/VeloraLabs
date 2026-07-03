export function mapHomepageRoleToAudience(role: string): string {
  switch (role) {
    case "Student":
      return "students";
    case "Engineer":
      return "engineers";
    case "Product Manager":
      return "professionals";
    default:
      return "professionals";
  }
}