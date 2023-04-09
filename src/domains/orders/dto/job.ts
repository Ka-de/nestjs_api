import { ApiProperty } from "@nestjs/swagger";
import { SizeEnum } from "../../designs/dto/size.enum";

export class Job {
    @ApiProperty({ description: 'The id of the design to be used' })
    designId: string;

    @ApiProperty({ description: 'The fabric for the job' })
    fabric: string;

    @ApiProperty({ description: 'The size for the job' })
    size: SizeEnum;

    @ApiProperty({ description: 'The color choosen for the job' })
    color: string;

    @ApiProperty({ description: 'The price of a single job item' })
    price: number;

    @ApiProperty({ description: 'The number of items within this job' })
    quantity: number;

    @ApiProperty({ description: 'The images of the job' })
    images?: string[];

    @ApiProperty({ description: 'Is job complete' })
    done: boolean;
}