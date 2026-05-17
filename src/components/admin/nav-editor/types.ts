/**
 * Editor form values. `id` is required on the client (every item — existing
 * or freshly added — has one so dnd-kit can sort by stable keys), even
 * though the server treats it as optional on save.
 */
export interface NavItemFormValue {
  id: string;
  label: string;
  url: string;
  openInNew: boolean;
  isVisible: boolean;
  children: NavItemFormValue[];
}

export interface NavEditorFormValues {
  items: NavItemFormValue[];
}
