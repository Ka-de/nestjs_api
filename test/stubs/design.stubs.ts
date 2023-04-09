import { CreateDesignDto } from "../../src/domains/designs/dto/create-design.dto";
import { SizeEnum } from "../../src/domains/designs/dto/size.enum";
import { Design } from "../../src/domains/designs/entities/design.entity";

export const createDesignStub = (image: string): CreateDesignDto => ({
  title: 'A design',
  description: 'A very simple design',
  materials: [
    {
      fabric: 'Ankara',
      colors: [
        {
          value: 'Multiple Colors',
          images: [
            image
          ]
        }
      ],
      sizes: [
        {
          value: SizeEnum.LARGE,
          price: 5000
        }
      ]
    }
  ],
  duration: 5
});

export const designStub = (image: string, designerId: string): Partial<Design> => ({
  ...createDesignStub(image),
  active: false,
  designerId
});
