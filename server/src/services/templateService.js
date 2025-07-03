import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class TemplateService {
  static async getTemplates(organizationId, filters = {}) {
    try {
      const { category, type, isActive, searchTerm } = filters;
      const whereClause = { organizationId };
      
      if (category) whereClause.category = category;
      if (type) whereClause.type = type;
      if (isActive !== undefined) whereClause.isActive = isActive;
      if (searchTerm) {
        whereClause.OR = [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } }
        ];
      }

      const templates = await prisma.messageTemplate.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return templates;
    } catch (error) {
      console.error("Error getting templates:", error);
      throw new Error("Failed to retrieve templates");
    }
  }

  static processTemplate(template, variables = {}) {
    try {
      let processedSubject = template.subject || "";
      let processedBodyText = template.bodyText;
      let processedBodyHtml = template.bodyHtml || "";

      Object.keys(variables).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, "g");
        const value = variables[key] || "";
        
        processedSubject = processedSubject.replace(placeholder, value);
        processedBodyText = processedBodyText.replace(placeholder, value);
        processedBodyHtml = processedBodyHtml.replace(placeholder, value);
      });

      return {
        subject: processedSubject,
        bodyText: processedBodyText,
        bodyHtml: processedBodyHtml,
        processedVariables: variables
      };
    } catch (error) {
      console.error("Error processing template:", error);
      throw new Error("Failed to process template");
    }
  }
}

export default TemplateService;
