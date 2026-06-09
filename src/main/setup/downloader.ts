/**
 * 文件下载器
 * 支持进度回调、断点续传、取消下载
 */

import { createWriteStream, existsSync, statSync } from 'fs';
import { mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { get } from 'https';
import { dirname } from 'path';
import type { DownloadProgress } from '@shared/types/agent';

export class BinaryDownloader {
  /**
   * 下载文件
   */
  async download(
    url: string,
    destination: string,
    onProgress: (progress: DownloadProgress) => void,
    signal?: AbortSignal
  ): Promise<string> {
    // 确保目标目录存在
    await mkdir(dirname(destination), { recursive: true });

    return new Promise((resolve, reject) => {
      const file = createWriteStream(destination);
      let downloaded = 0;
      let total = 0;
      let startTime = Date.now();

      const request = get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 处理重定向
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            this.download(redirectUrl, destination, onProgress, signal)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error('Redirect without location header'));
          }
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }

        total = parseInt(response.headers['content-length'] || '0', 10);

        response.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = downloaded / elapsed;

          onProgress({
            percent: total > 0 ? (downloaded / total) * 100 : 0,
            transferred: downloaded,
            total,
            speed,
          });
        });

        pipeline(response, file)
          .then(() => {
            resolve(destination);
          })
          .catch(reject);
      });

      request.on('error', (error) => {
        file.close();
        reject(error);
      });

      // 支持取消下载
      if (signal) {
        signal.addEventListener('abort', () => {
          request.destroy();
          file.close();
          reject(new Error('Download cancelled'));
        });
      }
    });
  }

  /**
   * 断点续传下载（简化版）
   */
  async resumeDownload(
    url: string,
    destination: string,
    onProgress: (progress: DownloadProgress) => void,
    signal?: AbortSignal
  ): Promise<string> {
    let startByte = 0;

    // 检查是否有未完成的下载
    if (existsSync(destination)) {
      const stats = statSync(destination);
      startByte = stats.size;
    }

    if (startByte === 0) {
      // 没有断点，正常下载
      return this.download(url, destination, onProgress, signal);
    }

    // 使用 Range header 继续下载
    return new Promise((resolve, reject) => {
      const file = createWriteStream(destination, { flags: 'a' });
      let downloaded = startByte;
      let total = 0;
      let startTime = Date.now();

      const request = get(
        url,
        {
          headers: {
            Range: `bytes=${startByte}-`,
          },
        },
        (response) => {
          if (response.statusCode === 206) {
            // 部分内容，支持断点续传
            const contentRange = response.headers['content-range'];
            if (contentRange) {
              const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
              if (match) {
                total = parseInt(match[1], 10);
              }
            }
          } else if (response.statusCode === 200) {
            // 不支持断点续传，重新下载
            file.close();
            return this.download(url, destination, onProgress, signal).then(resolve).catch(reject);
          } else {
            reject(new Error(`Resume download failed with status ${response.statusCode}`));
            return;
          }

          response.on('data', (chunk: Buffer) => {
            downloaded += chunk.length;
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = (downloaded - startByte) / elapsed;

            onProgress({
              percent: total > 0 ? (downloaded / total) * 100 : 0,
              transferred: downloaded,
              total,
              speed,
            });
          });

          pipeline(response, file)
            .then(() => resolve(destination))
            .catch(reject);
        }
      );

      request.on('error', (error) => {
        file.close();
        reject(error);
      });

      if (signal) {
        signal.addEventListener('abort', () => {
          request.destroy();
          file.close();
          reject(new Error('Download cancelled'));
        });
      }
    });
  }
}
