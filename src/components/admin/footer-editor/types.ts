export interface FooterLinkFormValue {
  id: string;
  label: string;
  url: string;
  openInNew: boolean;
  isVisible: boolean;
}

export interface FooterColumnFormValue {
  id: string;
  key: string;
  heading: string;
  isActive: boolean;
  links: FooterLinkFormValue[];
}

export interface FooterEditorFormValues {
  columns: FooterColumnFormValue[];
}
