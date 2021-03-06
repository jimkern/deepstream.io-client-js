'use strict'

const assert = require('assert');
const sinon = require( 'sinon' );

const clientHandler = require('./client-handler');
const utils = require('./utils');

function getRecordData( expression, recordName ) {
  return clientHandler.getClients( expression ).map( ( client ) => {
    return client.record.records[ recordName ];
  } );
}

function getListData( expression, listName ) {
  return clientHandler.getClients( expression ).map( ( client ) => {
    return client.record.lists[ listName ];
  } );
}

module.exports = function (){

  this.When(/(.+) gets? the record "([^"]*)"$/, function ( clientExpression, recordName, done) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
      let recordData = {
          record: client.client.record.getRecord( recordName ),
          discardCallback: sinon.spy(),
          deleteCallback: sinon.spy(),
          callbackError: sinon.spy(),
          subscribeCallback: sinon.spy(),
          subscribePathCallbacks: {}
        }
        recordData.record.on( 'discard', recordData.discardCallback );
        recordData.record.on( 'delete', recordData.deleteCallback );
        client.record.records[ recordName ] = recordData;
    } );
    setTimeout( done, utils.defaultDelay );
  });

  this.When(/(.+) sets the merge strategy to (remote|local)$/, function ( clientExpression, recordName, done) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
      let recordData = {
          record: client.client.record.getRecord( recordName ),
          discardCallback: sinon.spy(),
          deleteCallback: sinon.spy(),
          callbackError: sinon.spy(),
          subscribeCallback: sinon.spy(),
          subscribePathCallbacks: {}
        }
        recordData.record.on( 'discard', recordData.discardCallback );
        recordData.record.on( 'delete', recordData.deleteCallback );
        client.record.records[ recordName ] = recordData;
    } );
    setTimeout( done, utils.defaultDelay );
  });

  this.Then(/^(.+) gets? notified of record "([^"]*)" getting (discarded|deleted)$/, function (clientExpression, recordName, action) {
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      if( action === 'discarded' ) {
        sinon.assert.calledOnce( recordData.discardCallback );
        recordData.discardCallback.reset();
      } else {
        sinon.assert.calledOnce( recordData.deleteCallback );
        recordData.deleteCallback.reset();
      }
    });
  });

  this.Then(/^(.+) receives? an update for record "([^"]*)" with data '([^']+)'$/, function (clientExpression, recordName, data) {
    data = utils.parseData( data );
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      sinon.assert.calledOnce( recordData.subscribeCallback );
      sinon.assert.calledWith( recordData.subscribeCallback, data );
      recordData.subscribeCallback.reset();
    });
  });

  this.Then(/^(.+) receives? an update for record "([^"]*)" and path "([^"]*)" with data '([^']+)'$/, function (clientExpression, recordName, path, data) {
    data = utils.parseData( data );
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      sinon.assert.calledOnce( recordData.subscribePathCallbacks[ path ] );
      sinon.assert.calledWith( recordData.subscribePathCallbacks[ path ], data );
      recordData.subscribePathCallbacks[ path ].reset();
    });
  });

  this.Then(/^(.+) (?:don't|doesn't|does not) receive an update for record "([^"]*)"$/, function (clientExpression, recordName) {
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      sinon.assert.notCalled( recordData.subscribeCallback );
    });
  });

  this.Then(/^(.+) don't receive an update for record "([^"]*)" and path "([^"]*)"$/, function (clientExpression, recordName, path) {
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      sinon.assert.notCalled( recordData.subscribePathCallbacks[ path ] );
    });
  });

  this.Given(/^(.+) (un)?subscribes? to record "([^"]*)"( with immediate flag)?$/, ( clientExpression, not, recordName, immedate ) => {
     getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      if( !!not ) {
        recordData.record.unsubscribe( recordData.subscribeCallback );
      } else {
        recordData.record.subscribe( recordData.subscribeCallback, !!immedate );
      }
    });
  });

  this.Given(/^(.+) (un)?subscribes? to record "([^"]*)" with path "([^"]*)"( with immediate flag)?$/, ( clientExpression, not, recordName, path, immedate ) => {
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      if( !!not ) {
        recordData.record.unsubscribe( path, recordData.subscribePathCallbacks[ path ] );
      } else {
        recordData.subscribePathCallbacks[ path ] = sinon.spy();
        recordData.record.subscribe( path, recordData.subscribePathCallbacks[ path ], !!immedate );
      }
    });
  });

  this.Then(/^(.+) (?:have|has) record "([^"]*)" with data '([^']+)'$/, function ( clientExpression, recordName, data ) {
    data = utils.parseData( data );
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      assert.deepEqual( data, recordData.record.get() );
    } );
  });

  this.Then(/^(.+) (?:have|has) record "([^"]*)" with path "([^"]*)" and data '([^']+)'$/, function ( clientExpression, recordName, path, data ) {
    data = utils.parseData( data );
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      assert.deepEqual( data, recordData.record.get( path ) );
    } );
  });

  this.Given(/^(.+) (discards?|deletes?) record "([^"]*)"$/, function (clientExpression, action, recordName, done) {
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      if( action.indexOf( 'di') > -1 ) {
        recordData.record.discard();
      } else {
        recordData.record.delete();
      }
    } );
    setTimeout( done, utils.defaultDelay );
  });

  this.When(/^(.+) sets? the record "([^"]*)" with data '([^']+)'$/, function ( clientExpression, recordName, data, done) {
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      recordData.record.set( utils.parseData( data ) );
    } );
    setTimeout( done, utils.defaultDelay );
  });

  this.When(/^(.+) sets? the record "([^"]*)" and path "([^"]*)" with data '([^']+)'$/, function ( clientExpression, recordName, path, data, done) {
    getRecordData( clientExpression, recordName ).forEach( ( recordData ) => {
      recordData.record.set( path, utils.parseData( data ) );
    } );
    setTimeout( done, utils.defaultDelay );
  });

 this.Given(/^(.+) requests? a snapshot of record "([^"]*)"$/, function ( clientExpression, recordName, done) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
      client.client.record.snapshot( recordName, client.record.snapshotCallback );
    } );
    setTimeout( done, utils.defaultDelay );
  });

  this.Then(/^(.+) gets? a snapshot response for "([^"]*)" with (data|error) '([^']+)'$/, function ( clientExpression, recordName, type, data ) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
      sinon.assert.calledOnce(client.record.snapshotCallback);
      if( type === 'data' ) {
        sinon.assert.calledWith(client.record.snapshotCallback, null, utils.parseData( data ));
      } else {
        sinon.assert.calledWith(client.record.snapshotCallback, data.replace( /"/g, '' ) );
      }
      client.record.snapshotCallback.reset();
    } );
  });

  this.Given(/^(.+) asks? if record "([^"]*)" exists$/, function ( clientExpression, recordName, done ) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
      client.client.record.has( recordName, client.record.hasCallback );
    } );
    setTimeout( done, utils.defaultDelay );
  });

  this.Then(/^(.+) gets? told record "([^"]*)" (.*)exists?$/, function ( clientExpression, recordName, adjective ) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
      sinon.assert.calledOnce(client.record.hasCallback);
      sinon.assert.calledWith(client.record.hasCallback, null, adjective.indexOf('not') === -1 );
      client.record.hasCallback.reset();
    } );
  });

  /********************************************************************************************************************************
   *********************************************************** Lists ************************************************************
   ********************************************************************************************************************************/

  this.When(/(.+) gets? the list "([^"]*)"$/, function ( clientExpression, listName, done ) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
        let listData = {
          list: client.client.record.getList( listName ),
          discardCallback: sinon.spy(),
          deleteCallback: sinon.spy(),
          callbackError: sinon.spy(),
          subscribeCallback: sinon.spy(),
          addedCallback: sinon.spy(),
          removedCallback: sinon.spy(),
          movedCallback: sinon.spy()
        }
        listData.list.on( 'discard', listData.discardCallback );
        listData.list.on( 'delete', listData.deleteCallback );
        listData.list.on( 'entry-added', listData.addedCallback );
        listData.list.on( 'entry-removed', listData.removedCallback );
        listData.list.on( 'entry-moved', listData.movedCallback );
        listData.list.subscribe( listData.subscribeCallback );
        client.record.lists[ listName ] = listData;
    } );
    setTimeout( done, utils.defaultDelay );
  } );

  this.Given(/^(.+) sets the entries on the list "([^"]*)" to '([^']*)'$/, function (clientExpression, listName, data, done) {
    data = utils.parseData( data );
    getListData( clientExpression, listName ).forEach( ( listData ) => {
      listData.list.setEntries( data );
    });
    setTimeout( done, utils.defaultDelay );
  });

  this.Given(/^(.+) (adds|removes) an entry "([^"]*)" (?:to|from) "([^""]*)"$/, function (clientExpression, action, entryName, listName, done) {
    getListData( clientExpression, listName ).forEach( ( listData ) => {
      if( action === 'adds' ) {
        listData.list.addEntry( entryName );
      } else {
        listData.list.removeEntry( entryName );
      }
    });
    setTimeout( done, utils.defaultDelay );
  });


  this.Then(/^(.+) have a list "([^"]*)" with entries '([^']*)'$/, function (clientExpression, listName, data) {
    data = utils.parseData( data );
    getListData( clientExpression, listName ).forEach( ( listData ) => {
      assert.deepEqual( listData.list.getEntries(), data );
    });
  });

  this.Then(/^(.+) gets? notified of "([^"]*)" being (added|removed|moved) (?:to|in|from) "([^""]*)"$/, function (clientExpression, entryName, action, listName) {
    getListData( clientExpression, listName ).forEach( ( listData ) => {
      if( action === 'added' ) {
        sinon.assert.calledWith( listData.addedCallback, entryName );
      } else if( action === 'removed' ) {
        sinon.assert.calledWith( listData.removedCallback, entryName );
      } else {
        sinon.assert.calledWith( listData.movedCallback, entryName );
      }
    });
  });

  this.Then(/^(.+) gets? notified of list "([^"]*)" entries changing to '([^']*)'$/, function (clientExpression, listName, data) {
    data = utils.parseData( data );
    getListData( clientExpression, listName ).forEach( ( listData ) => {
      //sinon.assert.calledOnce( listData.subscribeCallback );
      sinon.assert.calledWith( listData.subscribeCallback, data );
    });
  });

  /********************************************************************************************************************************
   *********************************************************** ANONYMOUS RECORDS ************************************************************
   ********************************************************************************************************************************/

  this.When(/(.+) gets? a anonymous record$/, function ( clientExpression ) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
        client.record.anonymousRecord = client.client.record.getAnonymousRecord();
    } );
  });

  this.When(/(.+) sets? the underlying record to "([^"]*)" on the anonymous record$/, function ( clientExpression, recordName, done ) {
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
      console.log( recordName )
        client.record.anonymousRecord.setName( recordName );
    } );
    setTimeout( done, utils.defaultDelay );
  });

  this.When(/(.+) anonymous record data is '([^']*)'$/, function ( clientExpression, data ) {
    data = utils.parseData( data );
    clientHandler.getClients( clientExpression ).forEach( ( client ) => {
        assert.deepEqual( client.record.anonymousRecord.get(), data);
    } );
  });

}
