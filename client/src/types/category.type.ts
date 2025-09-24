
export default interface ICategory {
    _id?: string;
    name: string;
    slug: string;
    description?: string;
    parent?: Partial<ICategory>;
    level: number;
    path: string[];
    children?: ICategory[];
    attributes: {
      name: string;
      type: "text" | "number" | "boolean" | "select";
      required: boolean;
      options?: string[];
    }[];
    image?: string;
    productDimensionsRequired?: boolean;
    productWeightRequired?: boolean;
    isActive: boolean;
    createdBy: string;
    updatedBy: string;
    metadata?: Record<string, any>;
  }