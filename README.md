# GS Product Viewer

Fristående produktviewer med Gaussian Splatting, tröghet vid rotation och hotspots som döljs när sin sida vänds bort.

## Lösenordssteg
Modellen finns endast som model.enc i denna publiceringsmapp. PBKDF2-SHA256 (600000 iterationer) och AES-256-GCM låser upp modellen i webbläsaren. Lösenordet finns inte i webbfilernas kod och sparas inte i webbläsaren. Fel lösenord stoppas innan viewern startar.

Detta är ett enkelt demonstrationsskydd. Filen kan utsättas för lösenordsgissning offline, och en besökare med rätt lösenord kan spara den upplåsta modellen. För kundproduktion rekommenderas serverbaserad åtkomstkontroll.

## Publicering
GitHub Pages: Deploy from a branch, main, /(root).

## Lokalt
Starta en webbserver i denna mapp; öppna via localhost. Web Crypto kräver HTTPS eller localhost. Viewern behöver WebGL2 och hämtar Three.js/Spark från externa CDN efter upplåsning.
