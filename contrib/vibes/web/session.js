// A document must commit on the console's origin before its Strict cookie is
// sent after a link from another site. Replace the access link in history and
// retain a shared lesson/request fragment. No key is read or embedded here.
'use strict';
window.location.replace('/' + window.location.hash);
