/**
 * Admin CRUD for LeadForm + LeadFormField. Field ordering is owned by the
 * service: the editor sends an array, we rewrite the order column in a
 * single transaction. English translation upserted per field/form.
 */
import "server-only";
import { Prisma, type FormFieldType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const KEY_TAKEN = "KEY_TAKEN";
export const NOT_FOUND = "NOT_FOUND";

export async function listForms() {
  return prisma.leadForm.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { fields: true, submissions: true } },
      translations: { where: { locale: "EN" }, take: 1 },
    },
  });
}

export async function getForm(id: string) {
  return prisma.leadForm.findFirst({
    where: { id, deletedAt: null },
    include: {
      fields: {
        orderBy: { order: "asc" },
        include: { translations: { where: { locale: "EN" }, take: 1 } },
      },
      translations: { where: { locale: "EN" }, take: 1 },
    },
  });
}

export interface FormUpsertInput {
  key: string;
  successUrl?: string | null;
  webhookUrl?: string | null;
  emailTo?: string | null;
  isActive?: boolean;
  heading?: string | null;
  subheading?: string | null;
  submitLabel?: string;
  successMessage?: string | null;
  fields: Array<{
    id?: string; // omitted = create
    name: string;
    type: FormFieldType;
    isRequired?: boolean;
    isVisible?: boolean;
    validation?: unknown;
    options?: unknown;
    conditional?: unknown;
    label: string;
    placeholder?: string | null;
    helpText?: string | null;
  }>;
}

export async function createForm(input: FormUpsertInput) {
  try {
    const created = await prisma.$transaction(async (tx) => {
      const form = await tx.leadForm.create({
        data: {
          key: input.key,
          successUrl: input.successUrl ?? null,
          webhookUrl: input.webhookUrl ?? null,
          emailTo: input.emailTo ?? null,
          isActive: input.isActive ?? true,
          translations: {
            create: {
              locale: "EN",
              heading: input.heading ?? null,
              subheading: input.subheading ?? null,
              submitLabel: input.submitLabel ?? "Submit",
              successMessage: input.successMessage ?? null,
            },
          },
        },
      });
      for (const [i, f] of input.fields.entries()) {
        const field = await tx.leadFormField.create({
          data: {
            formId: form.id,
            name: f.name, type: f.type, order: i,
            isRequired: f.isRequired ?? false,
            isVisible: f.isVisible ?? true,
            validation: (f.validation ?? null) as Prisma.InputJsonValue,
            options: (f.options ?? null) as Prisma.InputJsonValue,
            conditional: (f.conditional ?? null) as Prisma.InputJsonValue,
            translations: {
              create: { locale: "EN", label: f.label, placeholder: f.placeholder ?? null, helpText: f.helpText ?? null },
            },
          },
        });
        void field;
      }
      return form;
    });
    return created;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new Error(KEY_TAKEN);
    throw e;
  }
}

export async function updateForm(id: string, input: FormUpsertInput) {
  const existing = await prisma.leadForm.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.leadForm.update({
        where: { id },
        data: {
          key: input.key,
          successUrl: input.successUrl ?? null,
          webhookUrl: input.webhookUrl ?? null,
          emailTo: input.emailTo ?? null,
          isActive: input.isActive ?? true,
        },
      });
      await tx.leadFormTranslation.upsert({
        where: { formId_locale: { formId: id, locale: "EN" } },
        update: {
          heading: input.heading ?? null,
          subheading: input.subheading ?? null,
          submitLabel: input.submitLabel ?? "Submit",
          successMessage: input.successMessage ?? null,
        },
        create: {
          formId: id, locale: "EN",
          heading: input.heading ?? null,
          subheading: input.subheading ?? null,
          submitLabel: input.submitLabel ?? "Submit",
          successMessage: input.successMessage ?? null,
        },
      });

      // Reconcile fields: keep ids that came back, delete the rest, create new ones.
      const incomingIds = input.fields.map((f) => f.id).filter((x): x is string => Boolean(x));
      await tx.leadFormField.deleteMany({
        where: { formId: id, NOT: { id: { in: incomingIds.length ? incomingIds : ["__none__"] } } },
      });

      for (const [i, f] of input.fields.entries()) {
        if (f.id) {
          await tx.leadFormField.update({
            where: { id: f.id },
            data: {
              name: f.name, type: f.type, order: i,
              isRequired: f.isRequired ?? false,
              isVisible: f.isVisible ?? true,
              validation: (f.validation ?? null) as Prisma.InputJsonValue,
              options: (f.options ?? null) as Prisma.InputJsonValue,
              conditional: (f.conditional ?? null) as Prisma.InputJsonValue,
            },
          });
          await tx.leadFormFieldTranslation.upsert({
            where: { fieldId_locale: { fieldId: f.id, locale: "EN" } },
            update: { label: f.label, placeholder: f.placeholder ?? null, helpText: f.helpText ?? null },
            create: { fieldId: f.id, locale: "EN", label: f.label, placeholder: f.placeholder ?? null, helpText: f.helpText ?? null },
          });
        } else {
          await tx.leadFormField.create({
            data: {
              formId: id, name: f.name, type: f.type, order: i,
              isRequired: f.isRequired ?? false, isVisible: f.isVisible ?? true,
              validation: (f.validation ?? null) as Prisma.InputJsonValue,
              options: (f.options ?? null) as Prisma.InputJsonValue,
              conditional: (f.conditional ?? null) as Prisma.InputJsonValue,
              translations: { create: { locale: "EN", label: f.label, placeholder: f.placeholder ?? null, helpText: f.helpText ?? null } },
            },
          });
        }
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new Error(KEY_TAKEN);
    throw e;
  }
}

export async function softDeleteForm(id: string) {
  const existing = await prisma.leadForm.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  await prisma.leadForm.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}
