'use strict';
// Loaded by /import. A shared link opened from another site reaches the
// console without its cookie; navigating again from here, inside the console's
// own origin, carries it. The request itself rides in the fragment, which is
// never sent to any server.
location.replace('/' + location.hash);
