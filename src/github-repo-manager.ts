import { Octokit } from '@octokit/rest';
import inquirer from 'inquirer';
import { Repository } from './types';
import { Utils } from './utils';

export class GitHubRepoManager {
  private octokit: Octokit;
  private username: string = '';

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('❌ GITHUB_TOKEN environment variable is required');
      process.exit(1);
    }
    this.octokit = new Octokit({ auth: token });
  }

  async start(): Promise<void> {
    try {
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      this.username = user.login;

      console.log(`\n🚀 Welcome to GitHub Repository Manager!`);
      console.log(`👤 Logged in as: ${user.login}`);
      console.log(`📧 Email: ${user.email || 'Not public'}`);

      await this.showMainMenu();
    } catch (error) {
      console.error('❌ Failed to authenticate with GitHub:', error);
      process.exit(1);
    }
  }

  private async showMainMenu(): Promise<void> {
    while (true) {
      console.log('\n' + '='.repeat(50));
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '🔧 What would you like to do?',
          choices: [
            { name: '👁️  Change repository visibility', value: 'visibility' },
            { name: '🗑️  Delete repositories', value: 'delete' },
            { name: '📋 List all repositories', value: 'list' },
            { name: '🚪 Exit', value: 'exit' },
          ],
        },
      ]);

      switch (action) {
        case 'visibility':
          await this.changeVisibilityFlow();
          break;
        case 'delete':
          await this.deleteRepositoriesFlow();
          break;
        case 'list':
          await this.listRepositories();
          break;
        case 'exit':
          console.log('\n👋 Goodbye!');
          return;
      }
    }
  }

  private async getAllRepositories(): Promise<Repository[]> {
    console.log('📡 Fetching repositories...');

    try {
      const repositories: Repository[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data } = await this.octokit.rest.repos.listForAuthenticatedUser(
          {
            per_page: 100,
            page,
            sort: 'updated',
            direction: 'desc',
          }
        );

        repositories.push(
          ...data.map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            description: repo.description || 'No description',
            language: repo.language || 'Unknown',
            updatedAt: repo.updated_at || new Date().toISOString(),
            size: repo.size,
          }))
        );

        hasMore = data.length === 100;
        page++;
      }

      return repositories;
    } catch (error) {
      console.error('❌ Failed to fetch repositories:', error);
      return [];
    }
  }

  private async listRepositories(): Promise<void> {
    const repos = await this.getAllRepositories();

    if (repos.length === 0) {
      console.log('📭 No repositories found.');
      return;
    }

    console.log(`\n📊 Found ${repos.length} repositories:\n`);
    console.log('┌' + '─'.repeat(75) + '┐');
    console.log(
      '│' +
        ' Repository Name'.padEnd(30) +
        '│' +
        ' Visibility'.padEnd(12) +
        '│' +
        ' Language'.padEnd(15) +
        '│' +
        ' Size (KB)'.padEnd(15) +
        '│'
    );
    console.log('├' + '─'.repeat(75) + '┤');

    const sortedRepos = Utils.sortRepositories(repos, 'updated');

    sortedRepos.forEach((repo) => {
      const name = Utils.truncateString(repo.name, 28);
      const visibility = repo.private ? '🔒 Private' : '🌍 Public';
      const language = Utils.truncateString(repo.language, 13);
      const size = Utils.formatSize(repo.size);

      console.log(
        '│' +
          ` ${name}`.padEnd(30) +
          '│' +
          ` ${visibility}`.padEnd(12) +
          '│' +
          ` ${language}`.padEnd(15) +
          '│' +
          ` ${size}`.padEnd(15) +
          '│'
      );
    });

    console.log('└' + '─'.repeat(75) + '┘');
  }

  private async changeVisibilityFlow(): Promise<void> {
    const { targetVisibility } = await inquirer.prompt([
      {
        type: 'list',
        name: 'targetVisibility',
        message: '🎯 What visibility do you want to set?',
        choices: [
          { name: '🌍 Make repositories Public', value: 'public' },
          { name: '🔒 Make repositories Private', value: 'private' },
        ],
      },
    ]);

    const repos = await this.getAllRepositories();

    if (repos.length === 0) {
      console.log('📭 No repositories found.');
      return;
    }

    const isTargetPrivate = targetVisibility === 'private';
    const filteredRepos = repos.filter(
      (repo) => repo.private !== isTargetPrivate
    );

    if (filteredRepos.length === 0) {
      console.log(`ℹ️  All repositories are already ${targetVisibility}.`);
      return;
    }

    const repoChoices = filteredRepos.map((repo) => ({
      name: `${repo.name} (${repo.private ? '🔒 Private' : '🌍 Public'}) - ${
        repo.language
      }`,
      value: repo.name,
      checked: false,
    }));

    const { selectedRepos } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedRepos',
        message: `📋 Select repositories to make ${targetVisibility}:`,
        choices: repoChoices,
        pageSize: 10,
      },
    ]);

    if (selectedRepos.length === 0) {
      console.log('ℹ️  No repositories selected.');
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `⚠️  Are you sure you want to make ${selectedRepos.length} repository(ies) ${targetVisibility}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('❌ Operation cancelled.');
      return;
    }

    console.log(`\n🔄 Changing visibility to ${targetVisibility}...`);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedRepos.length; i++) {
      const repoName = selectedRepos[i];
      const progress = Utils.displayProgressBar(i + 1, selectedRepos.length);
      process.stdout.write(`\r${progress}`);

      try {
        await this.octokit.rest.repos.update({
          owner: this.username,
          repo: repoName,
          private: isTargetPrivate,
        });
        console.log(`\n✅ ${repoName} - Changed to ${targetVisibility}`);
        successCount++;
      } catch (error) {
        console.log(`\n❌ ${repoName} - Failed to change visibility`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      if (i < selectedRepos.length - 1) {
        await Utils.delay(100);
      }
    }

    console.log();

    console.log(
      `\n📊 Summary: ${successCount} successful, ${errorCount} failed`
    );
  }

  private async deleteRepositoriesFlow(): Promise<void> {
    const repos = await this.getAllRepositories();

    if (repos.length === 0) {
      console.log('📭 No repositories found.');
      return;
    }

    const repoChoices = repos.map((repo) => ({
      name: `${repo.name} (${repo.private ? '🔒 Private' : '🌍 Public'}) - ${
        repo.language
      } - ${repo.description}`,
      value: repo.name,
      checked: false,
    }));

    const { selectedRepos } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedRepos',
        message:
          '🗑️  Select repositories to DELETE (⚠️  This action is irreversible!):',
        choices: repoChoices,
        pageSize: 10,
      },
    ]);

    if (selectedRepos.length === 0) {
      console.log('ℹ️  No repositories selected.');
      return;
    }

    console.log('\n⚠️  You are about to DELETE the following repositories:');
    selectedRepos.forEach((repo: string) => {
      console.log(`   • ${repo}`);
    });

    const { confirmDelete } = await inquirer.prompt([
      {
        type: 'input',
        name: 'confirmDelete',
        message: `Type "DELETE" to confirm deletion of ${selectedRepos.length} repository(ies):`,
        validate: (input: string) => {
          return input === 'DELETE'
            ? true
            : 'You must type "DELETE" to confirm';
        },
      },
    ]);

    if (confirmDelete !== 'DELETE') {
      console.log('❌ Operation cancelled.');
      return;
    }

    console.log('\n🗑️  Deleting repositories...');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedRepos.length; i++) {
      const repoName = selectedRepos[i];
      const progress = Utils.displayProgressBar(i + 1, selectedRepos.length);
      process.stdout.write(`\r${progress}`);

      try {
        await this.octokit.rest.repos.delete({
          owner: this.username,
          repo: repoName,
        });
        console.log(`\n✅ ${repoName} - Deleted successfully`);
        successCount++;
      } catch (error) {
        console.log(`\n❌ ${repoName} - Failed to delete`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      if (i < selectedRepos.length - 1) {
        await Utils.delay(200);
      }
    }

    console.log();

    console.log(`\n📊 Summary: ${successCount} deleted, ${errorCount} failed`);
  }
}
