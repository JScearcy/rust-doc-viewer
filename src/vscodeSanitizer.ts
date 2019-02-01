enum Command {
    getUrl,
    newPage,
}

declare var acquireVsCodeApi: any;

(function (vscode) {
    setTimeout(() => {
        const hrefs = Array.from(document.querySelectorAll('[href]'))
            .filter(el => (<any>el).href === '');
        hrefs.forEach((el, idx) => {
            const elId = idx.toString();
            const elHtml = el.outerHTML;
            if (!elHtml.includes('#')) {
                el.id = elId;
                vscode.postMessage({
                    elId: elId,
                    command: Command.getUrl,
                    el: el.outerHTML,
                });
            }
        });
    }, 500);

    window.addEventListener('message', (e) => {
        const message = e.data;
        const elToUpdate = document.getElementById(message.elId);
        if (elToUpdate) {
            elToUpdate.outerHTML = message.el;
        }
    });

    document.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.srcElement && validNavigableEl(e.srcElement)) {
            const el = e.srcElement;
            const href = decodeURIComponent((<any>el).href);
            if (href === '') {
                vscode.postMessage({
                    elId: el.id,
                    command: Command.newPage,
                    el: el.outerHTML,
                });
            } else if (href.includes('#')) {
                const id = href.split('#')[1];
                const elToScrollTo = document.getElementById(id);
                if (elToScrollTo) {
                    elToScrollTo.scrollIntoView();
                }
            } else {
                vscode.postMessage({
                    elId: el.id,
                    command: Command.newPage,
                    path: (<any>el).href
                });
                window.scroll(0, 0);
            }
        } else if (e.srcElement &&
            (e.srcElement.tagName === "SPAN" || e.srcElement.tagName === "P")) {
            const parentA = e.srcElement.parentElement;
            if (parentA && parentA.tagName === "A") {
                console.log('clicked el: ', e);
                if ((<any>parentA).href !== '') {
                    vscode.postMessage({
                        elId: parentA.id,
                        command: Command.newPage,
                        path: (<any>parentA).href
                    });
                } else {
                    vscode.postMessage({
                        elId: parentA.id,
                        command: Command.newPage,
                        el: parentA.outerHTML,
                    });
                }
            }
            
        }

        return false;
    });

    function validNavigableEl(element: Element): boolean {
        return element.classList.contains('crate')
            || element.tagName === 'A';
    }
})(acquireVsCodeApi());