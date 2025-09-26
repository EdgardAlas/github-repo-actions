import 'dotenv/config';
import { GitHubRepoManager } from './github-repo-manager';

async function main() {
  const manager = new GitHubRepoManager();
  await manager.start();
}

main().catch(console.error);
