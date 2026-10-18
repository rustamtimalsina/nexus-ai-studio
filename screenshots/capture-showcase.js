import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

async function main() {
  console.log('Launching Chrome with CDP...');
  const chrome = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--window-size=1920,1080',
      '--disable-gpu',
      '--hide-scrollbars',
      'about:blank',
    ]
  );

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error('No WebSocket URL found');

    const ws = new WebSocket(wsUrl);

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const msgId = id++;
        const onMsg = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', onMsg);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Navigating to client...');
    await send('Page.navigate', { url: 'https://client-two-tau-83.vercel.app' });
    await new Promise((r) => setTimeout(r, 3000));

    // Click the first prompt capsule or type code request
    console.log('Submitting prompt for code showcase...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const synthBtn = btns.find(b => b.textContent && b.textContent.includes('Quantum Code Synthesizer'));
          if (synthBtn) {
            synthBtn.click();
            return 'clicked capsule';
          }
          const textarea = document.querySelector('textarea');
          if (textarea) {
            textarea.value = 'Write a clean TypeScript utility for high-concurrency tasks with retry logic.';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            const form = textarea.closest('form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            return 'submitted form';
          }
          return 'none';
        })()
      `,
    });

    // Wait for streaming completion and rendering
    console.log('Waiting for AI response streaming...');
    await new Promise((r) => setTimeout(r, 4500));

    // Capture screenshot
    console.log('Capturing screenshot...');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    if (screenshot?.data) {
      writeFileSync(
        'screenshots/nexus-ai-conversation-code.png',
        Buffer.from(screenshot.data, 'base64')
      );
      console.log('Saved screenshots/nexus-ai-conversation-code.png successfully!');
    }

    // Now open Prompt Library modal for modal showcase
    console.log('Opening Prompt Library...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const promptBtn = btns.find(b => b.textContent && b.textContent.includes('Prompt Library'));
          if (promptBtn) promptBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const modalShot = await send('Page.captureScreenshot', { format: 'png' });
    if (modalShot?.data) {
      writeFileSync(
        'screenshots/nexus-ai-prompt-library.png',
        Buffer.from(modalShot.data, 'base64')
      );
      console.log('Saved screenshots/nexus-ai-prompt-library.png successfully!');
    }

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

main();
