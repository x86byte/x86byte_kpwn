document.addEventListener('DOMContentLoaded', () => {

    const cursorFollower = document.getElementById('cursor-follower');

    if (!cursorFollower) {
        console.error("Cursor follower element (#cursor-follower) not found.");
        document.body.style.cursor = 'auto';
    } else {
        let mouseX = -100, mouseY = -100;
        let followerX = -100, followerY = -100;
        const delay = 0.2;
        let rafId = null;
        let isCursorVisible = false;

        function updateCursor() {
            if (!isNaN(mouseX) && !isNaN(mouseY)) {
                followerX += (mouseX - followerX) * delay;
                followerY += (mouseY - followerY) * delay;
            }
            cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
            rafId = requestAnimationFrame(updateCursor);
        }

        function onMouseMove(e) {
            mouseX = e.clientX; mouseY = e.clientY;
            if (!isCursorVisible) {
                cursorFollower.style.opacity = '1'; isCursorVisible = true;
                if (!rafId) {
                    followerX = mouseX; followerY = mouseY;
                    updateCursor();
                }
            }
        }
        document.addEventListener('mousemove', onMouseMove, { passive: true });

    }


    const likeButtons = document.querySelectorAll('.like-button');
    const likedPostsKey = 'x86byte_liked_posts';
    let likedPosts = {};
    try { likedPosts = JSON.parse(localStorage.getItem(likedPostsKey)) || {}; }
    catch (e) { console.error("Error parsing liked posts:", e); likedPosts = {}; }

    likeButtons.forEach(button => {
        const postId = button.dataset.postId; if (!postId) return;
        const countSpan = button.querySelector('.like-count'); if (!countSpan) return;
        let currentLikes = parseInt(countSpan.textContent || '0');
        if (likedPosts[postId]) { button.classList.add('liked'); button.disabled = true; }
        button.addEventListener('click', () => {
            if (!likedPosts[postId]) {
                currentLikes++; countSpan.textContent = currentLikes;
                button.classList.add('liked'); button.disabled = true;
                likedPosts[postId] = true;
                try { localStorage.setItem(likedPostsKey, JSON.stringify(likedPosts)); }
                catch (e) { console.error("Error saving like status:", e); }
                console.log(`Liked post: ${postId} (Client-side only)`);
            }
        });
    });


    const shellOutput = document.getElementById('shell-output');
    const shellInput = document.getElementById('shell-input');
    const shellPrompt = document.getElementById('shell-prompt');
    const miniShell = document.getElementById('mini-shell');

    function getCurrentPathFromURL() {
        const path = window.location.pathname.toLowerCase(); const filename = path.substring(path.lastIndexOf('/') + 1);
        if (filename === '' || filename === 'index.html') return '/'; if (filename === 'about.html') return '/about';
        if (filename === 'contact.html') return '/contact'; if (filename === 'community.html') return '/community';
        if (path.includes('/articles')) return '/articles'; return path;
    }
    let currentPath = getCurrentPathFromURL();
    let commandHistory = []; let historyIndex = -1;
    function updatePrompt() { if (shellPrompt) shellPrompt.textContent = `x86byte_kpwn:${currentPath}$`; }
    function printToShell(text, type = 'output') {
         if (shellOutput) { const line = document.createElement('div'); line.textContent = text; line.className = type; shellOutput.appendChild(line); miniShell.scrollTop = miniShell.scrollHeight; }
    }
    function executeCommand(command) {
        const parts = command.trim().split(' ').filter(p => p !== ''); const cmd = parts[0]?.toLowerCase(); const args = parts.slice(1);
        printToShell(`${shellPrompt?.textContent || '$'} ${command}`, 'command');
        if (command) { commandHistory.push(command); historyIndex = commandHistory.length; }
        switch (cmd) {
            case 'help': printToShell('Available: help, ls, cd, pwd, cat, goto, clear, date'); break;
            case 'ls': if (currentPath === '/') printToShell('about contact community articles/'); else if (currentPath === '/articles') printToShell('(No articles yet)'); else printToShell(''); break; // Updated ls for /articles
            case 'pwd': printToShell(currentPath); break;
            case 'cd':
                let targetUrl = null, targetPath = null;
                if (args.length === 0 || args[0] === '/' || args[0] === '~') { targetUrl = 'index.html'; targetPath = '/'; }
                else if (args[0] === '..') { if (currentPath !== '/') { targetUrl = 'index.html'; targetPath = '/'; } else { targetPath = '/'; } }
                else { const targetDir = args[0].replace(/\/$/, ''); if (currentPath === '/') { if (targetDir === 'about') { targetUrl = 'about.html'; targetPath = '/about'; } else if (targetDir === 'contact') { targetUrl = 'contact.html'; targetPath = '/contact'; } else if (targetDir === 'community') { targetUrl = 'community.html'; targetPath = '/community'; } else if (targetDir === 'articles') { targetPath = '/articles'; } else { printToShell(`cd: No such file or directory: ${targetDir}`, 'error'); } } else { printToShell(`cd: Cannot navigate from ${currentPath}`, 'error'); } }
                if (targetUrl) { window.location.href = targetUrl; } else if (targetPath && targetPath !== currentPath) { currentPath = targetPath; updatePrompt(); } else { updatePrompt(); } break;
            case 'cat': if (currentPath === '/articles' && args.length > 0) printToShell(`Reading '${args[0]}' is not implemented yet.`); else if (args.length > 0) printToShell(`cat: '${args[0]}': Not a readable file here`, 'error'); else printToShell('cat: Missing filename', 'error'); break;
            case 'goto': if (args.length > 0) { let url = args[0]; if (!/^(https?:)?\/\//i.test(url)) url = 'https://' + url; printToShell(`Opening ${url} in a new tab...`); try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { printToShell(`goto: Error opening URL: ${e.message}`, 'error'); } } else printToShell('goto: Missing URL', 'error'); break;
            case 'clear': if (shellOutput) shellOutput.innerHTML = ''; break;
            case 'date': printToShell(new Date().toLocaleString()); break;
            case undefined: case '': break;
            default: printToShell(`command not found: ${cmd}`, 'error'); break;
        }
        if (shellInput) shellInput.focus();
    }

    if (shellInput && shellOutput && miniShell && shellPrompt) {
        updatePrompt(); printToShell("Welcome. Type 'help' for commands.");
        shellInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); executeCommand(shellInput.value); shellInput.value = ''; } else if (e.key === 'ArrowUp') { e.preventDefault(); if (commandHistory.length > 0) { historyIndex = Math.max(0, historyIndex - 1); shellInput.value = commandHistory[historyIndex]; setTimeout(() => shellInput.setSelectionRange(shellInput.value.length, shellInput.value.length), 0); } } else if (e.key === 'ArrowDown') { e.preventDefault(); if (historyIndex < commandHistory.length - 1) { historyIndex++; shellInput.value = commandHistory[historyIndex]; setTimeout(() => shellInput.setSelectionRange(shellInput.value.length, shellInput.value.length), 0); } else { historyIndex = commandHistory.length; shellInput.value = ''; } } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); executeCommand('clear'); } });
        miniShell.addEventListener('click', (e) => { if (e.target !== shellInput) shellInput.focus(); });
        shellInput.focus();
    } else { console.error("Mini-shell HTML elements not found."); }

});
