// screens/CallScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import io from 'socket.io-client';
import { 
  RTCPeerConnection, 
  mediaDevices, 
  RTCSessionDescription, 
  RTCView 
} from 'react-native-webrtc';

// Replace with your signaling server URL (use your local machine's IP if testing on a device)
const SIGNALING_SERVER_URL = 'https://signaling-server-5anh.onrender.com:3000';

// STUN server configuration (you can add TURN servers as needed)
const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const CallScreen = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callActive, setCallActive] = useState(false);
  
  // Refs to hold peer connection and socket connection
  const pc = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    // Connect to the signaling server
    socket.current = io.connect(SIGNALING_SERVER_URL);

    socket.current.on('connect', () => {
      console.log('Connected to signaling server');
    });

    // When receiving an offer from a remote peer, answer it
    socket.current.on('offer', async (offer) => {
      console.log('Received offer');
      if (!pc.current) {
        createPeerConnection();
      }
      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.current.emit('answer', answer);
        setCallActive(true);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // When receiving an answer, set it as the remote description
    socket.current.on('answer', async (answer) => {
      console.log('Received answer');
      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description from answer:', error);
      }
    });

    // When receiving ICE candidates, add them to the peer connection
    socket.current.on('ice-candidate', async (candidate) => {
      console.log('Received ICE candidate');
      try {
        if (pc.current) {
          await pc.current.addIceCandidate(candidate);
        }
      } catch (error) {
        console.error('Error adding received ICE candidate:', error);
      }
    });

    // Clean up on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
      endCall();
    };
  }, []);

  const createPeerConnection = () => {
    pc.current = new RTCPeerConnection(configuration);

    // When an ICE candidate is generated, send it to the remote peer
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        socket.current.emit('ice-candidate', event.candidate);
      }
    };

    // Listen for remote tracks using ontrack (the modern alternative to onaddstream)
    pc.current.ontrack = (event) => {
      console.log('Remote track received');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Get the local audio stream and add tracks to the peer connection
    mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        setLocalStream(stream);
        // For each track in the local stream, add it to the peer connection
        stream.getTracks().forEach(track => {
          pc.current.addTrack(track, stream);
        });
      })
      .catch((error) => {
        console.error('Error accessing local media:', error);
      });
  };

  // Start the call as the caller
  const startCall = async () => {
    createPeerConnection();
    try {
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      socket.current.emit('offer', offer);
      setCallActive(true);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  // End the call and clean up resources
  const endCall = () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    setCallActive(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        {callActive ? 'Call in Progress' : 'Not in Call'}
      </Text>
      <Button title={callActive ? 'Hang Up' : 'Start Call'} onPress={callActive ? endCall : startCall} />
      {/* For voice calls you might not need RTCView, but it's here if you later add video */}
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.stream}
          objectFit="cover"
        />
      )}
      {remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.stream}
          objectFit="cover"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 18,
    marginBottom: 20,
  },
  stream: {
    width: 200,
    height: 200,
    backgroundColor: 'black',
    marginVertical: 10,
  },
});

export default CallScreen;
