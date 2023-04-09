import { Global, Module } from '@nestjs/common';
import { DesignsService } from './designs.service';
import { DesignsController } from './designs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Design, DesignSchema } from './entities/design.entity';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Design.name, schema: DesignSchema}
    ])
  ],
  controllers: [DesignsController],
  providers: [DesignsService],
  exports: [DesignsService]
})
export class DesignsModule {}
