@conga/bass-express-session
----------------------------

The Bass ODM session store for the express-session module

Usage:

```
const session = require('express-session');
const BassSession = require('@conga/bass-express-session')(session);
 
/* ... initialize express app, etc. ... */
 
app.use(session({
    secret: 'secret-key',
 
    store: new BassSession({
        ttl: seconds,                   // time to live, in seconds (optional)
        bass: bassReference,            // bass instance or bass.createSession() instance
        manager: 'bass-manager-name',   // the bass manager name to use
        document: 'MappedDocument',     // the name of the mapped document to use for your session data
        expireField: 'expiresAtField',  // the field that holds the expiration data (if ttl is specified)
        dataField: 'dataField',         // the field that holds all the session data 
        sidField: 'sessionIdField'      // the field that holds the session id
    })
});
```

### @conga/framework-session

You can use this together with `@conga/framework-session` by changing your session's store module 
and options configuration:

```
# app/config/config.yml

session:

    store:

        # point the sore module to "bass-express-session"
        module: bass-express-session
 
        # configure the options
        options:
            ttl: 300                    # time to live, in seconds
            bass: {$bass}               # reference to the bass service (or bass.createSession() instance)
            manager: session.manager    # the bass manager to use
            document: Session           # the document used for sessions
            expireField: expiresAt      # the field in the document that contains the expiration date
            dataField: data             # the field that holds all the session data
```

# Install With NPM
You can install with NPM via `npm install @conga/bass-express-session`