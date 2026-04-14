/// Flutter Voice Service for Hostel Voice Assistant
/// Handles WebRTC connections and voice interactions with LiveKit server
///
/// Integration:
/// 1. Copy this to: lib/services/voice_service.dart
/// 2. Add dependencies to pubspec.yaml:
///    - livekit_flutter: ^0.5.0
///    - permission_handler: ^11.4.0
///    - riverpod: ^2.0.0
library;

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:livekit_flutter/livekit_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;

/// State for voice assistant session
class VoiceAssistantState {
  final bool isConnected;
  final bool isMicEnabled;
  final String currentTranscript;
  final String assistantResponse;
  final bool isListening;
  final String voiceGender;
  final String? errorMessage;
  final List<String> sessionHistory;

  VoiceAssistantState({
    this.isConnected = false,
    this.isMicEnabled = false,
    this.currentTranscript = '',
    this.assistantResponse = '',
    this.isListening = false,
    this.voiceGender = 'female',
    this.errorMessage,
    this.sessionHistory = const [],
  });

  VoiceAssistantState copyWith({
    bool? isConnected,
    bool? isMicEnabled,
    String? currentTranscript,
    String? assistantResponse,
    bool? isListening,
    String? voiceGender,
    String? errorMessage,
    List<String>? sessionHistory,
  }) {
    return VoiceAssistantState(
      isConnected: isConnected ?? this.isConnected,
      isMicEnabled: isMicEnabled ?? this.isMicEnabled,
      currentTranscript: currentTranscript ?? this.currentTranscript,
      assistantResponse: assistantResponse ?? this.assistantResponse,
      isListening: isListening ?? this.isListening,
      voiceGender: voiceGender ?? this.voiceGender,
      errorMessage: errorMessage,
      sessionHistory: sessionHistory ?? this.sessionHistory,
    );
  }
}

/// Voice Assistant Service - manages LiveKit connection and voice interactions
class VoiceAssistantService extends StateNotifier<VoiceAssistantState> {
  final Ref ref;
  Room? _room;
  LocalParticipant? _localParticipant;
  RemoteParticipant? _assistantParticipant;
  StreamSubscription? _transcriptSubscription;

  VoiceAssistantService(this.ref) : super(VoiceAssistantState());

  /// Initialize voice service and request permissions
  Future<bool> initialize() async {
    try {
      // Request microphone and speaker permissions
      final micStatus = await Permission.microphone.request();
      final speakerStatus = await Permission.speaker.request();

      if (!micStatus.isGranted || !speakerStatus.isGranted) {
        state = state.copyWith(
          errorMessage: 'Microphone/speaker permissions denied',
        );
        return false;
      }

      state = state.copyWith(isMicEnabled: true);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: 'Permission error: $e');
      return false;
    }
  }

  /// Connect to LiveKit voice agent server
  Future<bool> connect({
    required String serverUrl,
    required String roomName,
    required String userName,
    String? backendApiUrl,
    String language = 'en',
    String voiceGender = 'female',
  }) async {
    try {
      state = state.copyWith(
        isConnected: false,
        errorMessage: null,
        voiceGender: voiceGender,
      );

      // Get Supabase user for JWT token
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        state = state.copyWith(errorMessage: 'User not authenticated');
        return false;
      }

      // Get user role from Supabase metadata or your database
      final userRole = _getUserRole(user);

      // Create room with metadata (user context passed to voice agent)
      _room = Room();

      // Setup event listeners before connecting
      _setupRoomListeners();

      // Generate LiveKit token (requires backend endpoint)
      final token = await _generateToken(
        serverUrl: serverUrl,
        backendApiUrl: backendApiUrl,
        roomName: roomName,
        userName: userName,
        userId: user.id,
        userRole: userRole,
        language: language,
        voiceGender: voiceGender,
      );

      // Connect to LiveKit
      await _room!.connect(serverUrl, token);

      state = state.copyWith(isConnected: true);
      return true;
    } catch (e) {
      state = state.copyWith(
        isConnected: false,
        errorMessage: 'Connection failed: $e',
      );
      return false;
    }
  }

  /// Setup room event listeners for transcripts and responses
  void _setupRoomListeners() {
    if (_room == null) return;

    // Listen for local participant (user's voice)
    _room!.onParticipantAdded.stream.listen((participant) {
      if (participant is LocalParticipant) {
        _localParticipant = participant;
        _setupLocalParticipantListeners();
      } else if (participant is RemoteParticipant) {
        _assistantParticipant = participant;
        _setupRemoteParticipantListeners();
      }
    });

    // Listen for room disconnection
    _room!.onDisconnect.stream.listen((_) {
      state = state.copyWith(
        isConnected: false,
        isListening: false,
        currentTranscript: '',
      );
    });
  }

  /// Setup listeners for local participant (mic input)
  void _setupLocalParticipantListeners() {
    if (_localParticipant == null) return;

    // Track when user is speaking
    _localParticipant!.onTrackSubscribed.stream.listen((track) {
      if (track.kind == TrackType.AUDIO) {
        // User's voice is being captured
        state = state.copyWith(isListening: true);
      }
    });
  }

  /// Setup listeners for assistant participant (agent response)
  void _setupRemoteParticipantListeners() {
    if (_assistantParticipant == null) return;

    // Track assistant's audio response
    _assistantParticipant!.onTrackSubscribed.stream.listen((track) {
      if (track.kind == TrackType.AUDIO) {
        // Assistant is responding
        state = state.copyWith(assistantResponse: 'Assistant is speaking...');
      }
    });
  }

  /// Start voice recording and send to assistant
  Future<void> startRecording() async {
    if (!state.isConnected || _localParticipant == null) {
      state = state.copyWith(errorMessage: 'Not connected to voice service');
      return;
    }

    try {
      state = state.copyWith(
        isListening: true,
        currentTranscript: 'Listening...',
        errorMessage: null,
      );

      // The LiveKit WebRTC connection handles audio capture automatically
      // No additional recording setup needed
    } catch (e) {
      state = state.copyWith(errorMessage: 'Recording error: $e');
    }
  }

  /// Stop recording
  Future<void> stopRecording() async {
    state = state.copyWith(isListening: false);
  }

  /// Update current transcript (simulated - in real app, use STT service)
  void updateTranscript(String text) {
    final history = [...state.sessionHistory, 'User: $text'];
    state = state.copyWith(currentTranscript: text, sessionHistory: history);
  }

  /// Update assistant response
  void updateAssistantResponse(String text) {
    final history = [...state.sessionHistory, 'Assistant: $text'];
    state = state.copyWith(assistantResponse: text, sessionHistory: history);
  }

  /// Disconnect from voice session
  Future<void> disconnect() async {
    try {
      _transcriptSubscription?.cancel();
      await _room?.disconnect();
      _room = null;
      _localParticipant = null;
      _assistantParticipant = null;

      state = state.copyWith(
        isConnected: false,
        isListening: false,
        currentTranscript: '',
        assistantResponse: '',
      );
    } catch (e) {
      state = state.copyWith(errorMessage: 'Disconnect error: $e');
    }
  }

  /// Generate LiveKit token (requires backend endpoint)
  /// Backend should handle JWT creation with Supabase auth
  Future<String> _generateToken({
    required String serverUrl,
    String? backendApiUrl,
    required String roomName,
    required String userName,
    required String userId,
    required String userRole,
    required String language,
    required String voiceGender,
  }) async {
    try {
      // Call backend API to generate token
      // Your backend should:
      // 1. Verify Supabase JWT
      // 2. Extract user_id, user_role from JWT
      // 3. Create LiveKit token with these claims in metadata
      // 4. Return token to client

      // Example backend endpoint:
      // POST /api/voice/generate-token
      // Headers: Authorization: Bearer <supabase_jwt>
      // Body: { roomName, language, voice_gender }
      // Response: { token }

      final supabase = Supabase.instance.client;
      final session = supabase.auth.currentSession;

      if (session?.accessToken == null) {
        throw Exception('No access token available');
      }

      final apiBase = _resolveBackendApiBase(
        livekitServerUrl: serverUrl,
        backendApiUrl: backendApiUrl,
      );

      final response = await http.post(
        Uri.parse('$apiBase/api/voice/generate-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${session!.accessToken}',
        },
        body: jsonEncode({
          'room_name': roomName,
          'language': language,
          'voice_gender': voiceGender,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception(
          'Token API failed (${response.statusCode}): ${response.body}',
        );
      }

      final payload = jsonDecode(response.body) as Map<String, dynamic>;
      final token = payload['token'] as String?;
      if (token == null || token.isEmpty) {
        throw Exception('Token response missing token field');
      }

      return token;
    } catch (e) {
      rethrow;
    }
  }

  String _resolveBackendApiBase({
    required String livekitServerUrl,
    String? backendApiUrl,
  }) {
    if (backendApiUrl != null && backendApiUrl.isNotEmpty) {
      return backendApiUrl.replaceAll(RegExp(r'/+$'), '');
    }

    if (livekitServerUrl.startsWith('wss://')) {
      return livekitServerUrl
          .replaceFirst('wss://', 'https://')
          .replaceAll(RegExp(r'/+$'), '');
    }

    if (livekitServerUrl.startsWith('ws://')) {
      return livekitServerUrl
          .replaceFirst('ws://', 'http://')
          .replaceAll(RegExp(r'/+$'), '');
    }

    return livekitServerUrl.replaceAll(RegExp(r'/+$'), '');
  }

  /// Get user role from Supabase (implement based on your schema)
  String _getUserRole(User user) {
    // Implement based on your user role storage
    // Example: fetch from profiles table
    // For now, default to 'student'
    return 'student';
  }
}

/// Riverpod state provider for voice assistant
final voiceAssistantProvider =
    StateNotifierProvider<VoiceAssistantService, VoiceAssistantState>((ref) {
      return VoiceAssistantService(ref);
    });

/// Voice Assistant Widget - UI component for voice interactions
class VoiceAssistantWidget extends ConsumerWidget {
  final String serverUrl;
  final String roomName;
  final String language;

  const VoiceAssistantWidget({
    required this.serverUrl,
    required this.roomName,
    this.language = 'en',
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voiceState = ref.watch(voiceAssistantProvider);
    final voiceNotifier = ref.read(voiceAssistantProvider.notifier);

    return GestureDetector(
      onLongPress: () {
        // Start recording on long press
        if (!voiceState.isListening) {
          voiceNotifier.startRecording();
        }
      },
      onLongPressUp: () {
        // Stop recording on release
        voiceNotifier.stopRecording();
      },
      child: Container(
        decoration: BoxDecoration(
          color: voiceState.isListening
              ? const Color(0xFF8B0000).withOpacity(0.1)
              : Colors.grey[100],
          border: Border.all(
            color: voiceState.isListening
                ? const Color(0xFF8B0000)
                : Colors.grey[400]!,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Pulsing animation when listening
            if (voiceState.isListening)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFF8B0000).withOpacity(0.3),
                      width: 2,
                    ),
                  ),
                ),
              ),
            // Main content
            SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    // Microphone icon / Status
                    Icon(
                      voiceState.isListening ? Icons.mic : Icons.mic_none,
                      size: 32,
                      color: voiceState.isListening
                          ? const Color(0xFF8B0000)
                          : Colors.grey[600],
                    ),
                    const SizedBox(height: 12),

                    // Current transcript
                    if (voiceState.currentTranscript.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Text(
                          voiceState.currentTranscript,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),

                    // Assistant response
                    if (voiceState.assistantResponse.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF8B0000).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          padding: const EdgeInsets.all(12),
                          child: Text(
                            voiceState.assistantResponse,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: const Color(0xFF8B0000)),
                          ),
                        ),
                      ),

                    // Error message
                    if (voiceState.errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Text(
                          voiceState.errorMessage!,
                          textAlign: TextAlign.center,
                          style: Theme.of(
                            context,
                          ).textTheme.bodySmall?.copyWith(color: Colors.red),
                        ),
                      ),

                    const SizedBox(height: 8),
                    Text(
                      voiceState.isListening
                          ? 'Listening... (Release to send)'
                          : 'Press and hold to record voice command',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: voiceState.isListening
                            ? const Color(0xFF8B0000)
                            : Colors.grey[600],
                      ),
                    ),

                    // Connection status
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: voiceState.isConnected
                                  ? Colors.green
                                  : Colors.grey,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            voiceState.isConnected
                                ? 'Connected to Voice Assistant'
                                : 'Not Connected',
                            style: Theme.of(context).textTheme.labelSmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Floating action button for voice assistant
class VoiceAssistantFAB extends ConsumerWidget {
  final String serverUrl;
  final String roomName;

  const VoiceAssistantFAB({
    required this.serverUrl,
    required this.roomName,
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voiceState = ref.watch(voiceAssistantProvider);
    final voiceNotifier = ref.read(voiceAssistantProvider.notifier);

    return FloatingActionButton(
      backgroundColor: const Color(0xFF8B0000),
      onPressed: voiceState.isConnected
          ? null
          : () async {
              // Initialize and connect to voice service
              final initialized = await voiceNotifier.initialize();
              if (initialized) {
                await voiceNotifier.connect(
                  serverUrl: serverUrl,
                  roomName: roomName,
                  userName: 'Student',
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Voice assistant connected!')),
                );
              }
            },
      child: Icon(
        voiceState.isConnected ? Icons.close : Icons.mic,
        color: Colors.white,
      ),
    );
  }
}
