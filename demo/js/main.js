// register the service worker if available
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(function (reg) {
        initialiseState();
        console.log('Successfully registered service worker', reg);
    }).catch(function (err) {
        console.warn('Error whilst registering service worker', err);
    });
}
var isPushEnabled = false;
window.addEventListener('online', function (e) {
    // re-sync data with server
    console.log("You are online");
    Page.hideOfflineWarning();
    Arrivals.loadData();
}, false);

window.addEventListener('load', function () {
    var pushButton = document.querySelector('.js-push-button');
    pushButton.addEventListener('click', function () {
        
        if (isPushEnabled) {
            isPushEnabled = false;
            unsubscribe();
        } else {
            isPushEnabled = true;
            subscribe();
        }
    });


});

window.addEventListener('offline', function (e) {
    // queue up events for server
    console.log("You are offline");
    // Page.showOfflineWarning();
}, false);

// check if the user is connected
if (navigator.onLine) {
    Arrivals.loadData();
} else {
    // show offline message
    Page.showOfflineWarning();
}

// set knockout view model bindings
ko.applyBindings(Page.vm);
// Once the service worker is registered set the initial state  
function initialiseState() {
    // Are Notifications supported in the service worker?  
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
        console.warn('Notifications aren\'t supported.');
        return;
    }

    // Check the current Notification permission.  
    // If its denied, it's a permanent block until the  
    // user changes the permission  
    if (Notification.permission === 'denied') {
        console.warn('The user has blocked notifications.');
        return;
    }

    // Check if push messaging is supported  
    if (!('PushManager' in window)) {
        console.warn('Push messaging isn\'t supported.');
        return;
    }

    // We need the service worker registration to check for a subscription  
    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        // Do we already have a push message subscription?  
        serviceWorkerRegistration.pushManager.getSubscription()
          .then(function (subscription) {
              // Enable any UI which subscribes / unsubscribes from  
              // push messages.  
              var pushButton = document.querySelector('.js-push-button');
              // pushButton.disabled = false;

              if (!subscription) {
                  // We aren't subscribed to push, so set UI  
                  // to allow the user to enable push  
                  return;
              }

              // Keep your server in sync with the latest subscriptionId
              sendSubscriptionToServer(subscription);

              // Set your UI to show they have subscribed for  
              // push messages  
              pushButton.textContent = 'Disable Push Messages';
              isPushEnabled = true;
          })
          .catch(function (err) {
              console.warn('Error during getSubscription()', err);
          });
    });
}
function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function subscribe() {
    // Disable the button so it can't be changed while  
    // we process the permission request  
    var pushButton = document.querySelector('.js-push-button');
    // pushButton.disabled = true;
  
    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true,
           
            gcm_sender_id: "301959113628"
        })
          .then(function (subscription) {
            
              // The subscription was successful  
              isPushEnabled = true;
              pushButton.textContent = 'Disable Push Messages';
              // pushButton.disabled = false;
              console.log(subscription);
              // TODO: Send the subscription.endpoint to your server  
              // and save it to send a push message at a later date
              return subscription;
          })
          .catch(function (e) {
            
              if (Notification.permission === 'denied') {
                  // The user denied the notification permission which  
                  // means we failed to subscribe and the user will need  
                  // to manually change the notification permission to  
                  // subscribe to push messages  
                  console.warn('Permission for Notifications was denied');
                  // pushButton.disabled = true;
              } else {
                  // A problem occurred with the subscription; common reasons  
                  // include network errors, and lacking gcm_sender_id and/or  
                  // gcm_user_visible_only in the manifest.  
                  console.error('Unable to subscribe to push.', e);
                  //pushButton.disabled = false;
                  pushButton.textContent = 'Enable Push Messages';
              }
          });
    });
}
function unsubscribe() {
    // Disable the button so it can't be changed while  
    // we process the permission request  
    var pushButton = document.querySelector('.js-push-button');
    //pushButton.disabled = true;

    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.unsubscribe()
          .then(function (subscription) {
              // The subscription was successful  
              isPushEnabled = false;
              pushButton.textContent = 'Enable Push Messages';
              //  pushButton.disabled = true;

              // TODO: Send the subscription.endpoint to your server  
              // and save it to send a push message at a later date
              return sendSubscriptionToServer(subscription);
          })
          .catch(function (e) {
              if (Notification.permission === 'denied') {
                  // The user denied the notification permission which  
                  // means we failed to subscribe and the user will need  
                  // to manually change the notification permission to  
                  // subscribe to push messages  
                  console.warn('Permission for Notifications was denied');
                  // pushButton.disabled = true;
              } else {
                  // A problem occurred with the subscription; common reasons  
                  // include network errors, and lacking gcm_sender_id and/or  
                  // gcm_user_visible_only in the manifest.  
                  console.error('Unable to subscribe to push.', e);
                  // pushButton.disabled = false;
                  pushButton.textContent = 'Enable Push Messages';
              }
          });
    });
}
self.addEventListener('push', function (event) {
    console.log('Received a push message', event);

    var title = 'Yay a message.';
    var body = 'We have received a push message.';
    var icon = '/launcher-icon-8x.png';
    var tag = 'simple-push-demo-notification-tag';

    event.waitUntil(
      self.registration.showNotification(title, {
          body: body,
          icon: icon,
          tag: tag
      })
    );
});