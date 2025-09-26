import { Repository } from './types';

export class Utils {
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  static formatSize(sizeInKB: number): string {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    } else if (sizeInKB < 1024 * 1024) {
      return `${(sizeInKB / 1024).toFixed(1)} MB`;
    } else {
      return `${(sizeInKB / (1024 * 1024)).toFixed(1)} GB`;
    }
  }

  static truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  static sortRepositories(
    repos: Repository[],
    sortBy: 'name' | 'updated' | 'size' = 'updated'
  ): Repository[] {
    return repos.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        case 'updated':
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });
  }

  static filterRepositories(
    repos: Repository[],
    filter: {
      private?: boolean;
      language?: string;
      minSize?: number;
      maxSize?: number;
    }
  ): Repository[] {
    return repos.filter((repo) => {
      if (filter.private !== undefined && repo.private !== filter.private) {
        return false;
      }
      if (
        filter.language &&
        repo.language.toLowerCase() !== filter.language.toLowerCase()
      ) {
        return false;
      }
      if (filter.minSize !== undefined && repo.size < filter.minSize) {
        return false;
      }
      if (filter.maxSize !== undefined && repo.size > filter.maxSize) {
        return false;
      }
      return true;
    });
  }

  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static displayProgressBar(
    current: number,
    total: number,
    width: number = 30
  ): string {
    const percentage = (current / total) * 100;
    const filled = Math.floor((current / total) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage.toFixed(1)}% (${current}/${total})`;
  }
}
