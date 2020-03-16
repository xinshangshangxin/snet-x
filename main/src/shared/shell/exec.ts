import { exec as originExec } from 'child_process';
import { promisify } from 'util';

export const exec = promisify(originExec);
