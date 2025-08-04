//eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as process from 'node:process';
import cluster from 'cluster';
import os from 'os';

import { Injectable } from '@nestjs/common';

const totalCPUs = os.cpus().length;

const numCPUs = Math.max(totalCPUs - 1, 1);

@Injectable()
export class ClusterService {
	static clusterize(callback): void {
		if (cluster.isMaster) {
			for (let i = 0; i < numCPUs; i++) {
				cluster.fork();
			}
		} else {
			callback();
		}
	}
}
