import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';
import { setupMetrics } from './metrics';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', register.contentType)
  async getMetrics(): Promise<string> {
    setupMetrics();
    return register.metrics();
  }
}
