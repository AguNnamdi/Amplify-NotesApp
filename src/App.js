import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import  { Hub } from '@aws-amplify/core';
import { DataStore, Predicates } from '@aws-amplify/datastore';
import { Note } from './models';
import { withAuthenticator } from 'aws-amplify-react';

async function listNotes(setNotes) {
  const notes = await DataStore.query(Note, Predicates.ALL);
  setNotes(notes);
}

function App() {
  const [notes, setNotes] = useState([]);
  const [value, setValue] = useState("");
  const [id, setId] = useState("");
  const [displayAdd, setDisplayAdd] = useState(true);
  const [displayUpdate, setDisplayUpdate] = useState(false);
  const [displaySearch, setDisplaySearch] = useState(false);

  async function handleSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    await DataStore.save(
      new Note({
        note: value
      })
    );
    listNotes(setNotes);
    setValue("")
  };

  async function handleSearch(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    setDisplaySearch(true);
    const search = await DataStore.query(Note, c => c.note("contains", value));
    setNotes(search);
    setValue("");
  }

  async function handleDelete(id) {
    const toDelete = await DataStore.query(Note, id);
    await DataStore.delete(toDelete);
  }

  async function handleSelect(note) {
    setValue(note.note);
    setId(note.id);
    setDisplayUpdate(true);
    setDisplayAdd(false);
  }

  async function handleUpdate(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const original = await DataStore.query(Note, id);
    await DataStore.save(
      Note.copyOf(original, updated => {updated.note = value} )
    );
    listNotes(setNotes);
    setDisplayAdd(true);
    setDisplayUpdate(false);
    setValue("");
  }

  useEffect(() => {
    listNotes(setNotes);

    const listener = (data) => {
      if (data.payload.event === "signOut"){
        DataStore.clear();
      }
    }
    Hub.listen('auth', listener );

    const subscription = DataStore.observe(Note).subscribe(msg => {
      listNotes(setNotes);
    });

    const handleConnectionChange = () => {
      const condition = navigator.onLine ? "onLine" : "offline";
      console.log(condition);
      if (condition === "online") {
        listNotes(setNotes);
      }
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange)

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      <header className="jumbotron jumbotron-fluid bg-dark">
        <img src={logo} className="App-logo" alt="logo" style={{ height: "150px" }}/>
      </header>
      <div className="container">
        { displayAdd ? (
          <form>
            <div className="input-group mb-3">
              <input type="text" className="form-control form-control-lg" placeholder= "NewNote" aria-label="Note" aria-describedby="basic-addon2" value={value} onChange={e => setValue(e.target.value)} />
              <div className="input-group-append">
                <button className="btn btn-warning border border-light text-white font-weight-bold" type="button" onClick={e => { handleSubmit(e); }}>
                  Add Note
                </button>
                <button className="btn btn-warning border border-light text-white font-weight-bold" type="button" onClick={e => { handleSearch(e); }} >
                  Search
                </button>
              </div>
            </div>
          </form>
        ) : null}
        {displayUpdate ? (
          <form onSubmit={e => {handleUpdate(e); }}>
            <div className="input-group mb-3">
              <input type="text" className="form-control form-control-lg" placeholder= "Update Note" aria-label="Note" aria-describedby="basic-addon2" value={value} onChange={e => setValue(e.target.value)} />
              <div className="input-group-append">
                  <button className="btn btn-warning text-white font-weight-bold" type="submit" >
                    Update Note
                  </button>
              </div>
            </div>
          </form>
        ): null}
      </div>

      <div className="container">
        {notes.map((item, i) => {
          return (
            <div className="alert alert-warning alert-dismissible text-dark show" role="alert">
              <span key={item.i} onClick={() => handleSelect(item)}>
                {item.note}
              </span>
              <button key={item.i} type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => { handleDelete(item.id); listNotes(setNotes); }} >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          );
        })}
        {displaySearch ? (
          <button className="button btn-warning float-right text-white font-weight-bold" onClick={() => {setDisplaySearch(false); listNotes(setNotes); }}>
            <span aria-hidden="true">Clear Search</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default withAuthenticator(App, { includeGreetings: true });