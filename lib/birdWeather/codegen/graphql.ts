/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Represents non-fractional signed whole numeric values. Since the value may exceed the size of a 32-bit integer, it's encoded as a string. */
  BigInt: { input: any; output: any; }
  /** An ISO 8601-encoded date */
  ISO8601Date: { input: any; output: any; }
  /** An ISO 8601-encoded datetime */
  ISO8601DateTime: { input: any; output: any; }
  /** Represents untyped JSON */
  JSON: { input: any; output: any; }
  /** A float representing an hour of the day or an ISO8601 timestamp */
  SpeciesCountKey: { input: any; output: any; }
  /** A valid time zone, transported as a string */
  TimeZone: { input: any; output: any; }
};

export type AccelReading = {
  __typename?: 'AccelReading';
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
  x?: Maybe<Scalars['Float']['output']>;
  y?: Maybe<Scalars['Float']['output']>;
  z?: Maybe<Scalars['Float']['output']>;
};

/** The connection type for AccelReading. */
export type AccelReadingConnection = {
  __typename?: 'AccelReadingConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<AccelReadingEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<AccelReading>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type AccelReadingEdge = {
  __typename?: 'AccelReadingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<AccelReading>;
};

/** Air pollution reading provided by OpenWeather */
export type AirPollutionReading = {
  __typename?: 'AirPollutionReading';
  /** Air Quality Index. Possible values: 1, 2, 3, 4, 5. Where 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor. */
  aqi: Scalars['Int']['output'];
  /** Сoncentration of CO (Carbon monoxide), μg/m3 */
  co: Scalars['Float']['output'];
  /** Geographic coordinates of the reading */
  coords: Coordinates;
  /** Сoncentration of NH3 (Ammonia), μg/m3 */
  nh3: Scalars['Float']['output'];
  /** Сoncentration of NO (Nitrogen monoxide), μg/m3 */
  no: Scalars['Float']['output'];
  /** Сoncentration of NO2 (Nitrogen dioxide), μg/m3 */
  no2: Scalars['Float']['output'];
  /** Сoncentration of O3 (Ozone), μg/m3 */
  o3: Scalars['Float']['output'];
  /** Сoncentration of PM2.5 (Fine particles matter), μg/m3 */
  pm2_5: Scalars['Float']['output'];
  /** Сoncentration of PM10 (Coarse particulate matter), μg/m3 */
  pm10: Scalars['Float']['output'];
  /** Сoncentration of SO2 (Sulphur dioxide), μg/m3 */
  so2: Scalars['Float']['output'];
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

export type BinnedSpeciesCount = {
  __typename?: 'BinnedSpeciesCount';
  bins: Array<SpeciesCountBin>;
  count: Scalars['Int']['output'];
  species: Species;
  speciesId: Scalars['ID']['output'];
};

export type BinnedSpeciesSummaryCount = {
  __typename?: 'BinnedSpeciesSummaryCount';
  counts: Array<SummarySpeciesCount>;
  date: Scalars['ISO8601Date']['output'];
  dayOfYear: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Coordinates = {
  __typename?: 'Coordinates';
  /** Latitude */
  lat: Scalars['Float']['output'];
  /** Longitude */
  lon: Scalars['Float']['output'];
};

export type Count = {
  __typename?: 'Count';
  count: Scalars['Int']['output'];
  type: Scalars['String']['output'];
};

export type Counts = {
  __typename?: 'Counts';
  birdnet?: Maybe<Scalars['Int']['output']>;
  breakdown: CountsBreakdown;
  detections: Scalars['Int']['output'];
  species: Scalars['Int']['output'];
  stations: Scalars['Int']['output'];
};

export type CountsBreakdown = {
  __typename?: 'CountsBreakdown';
  stations: Array<Count>;
};

/** An audio detection of a species by a BirdWeather station. */
export type Detection = Record & {
  __typename?: 'Detection';
  /** Calculated certainty */
  certainty: Scalars['String']['output'];
  /** Reported confidence */
  confidence: Scalars['Float']['output'];
  /** Geographic coordinates of the detection */
  coords: Coordinates;
  /** The detection's vicinity to the 2024 Solar Eclipse path of totality (total, partial or null) */
  eclipse?: Maybe<Scalars['String']['output']>;
  /** URL for favoriting detections */
  favoriteUrl: Scalars['String']['output'];
  /** URL for flagging detections */
  flagUrl: Scalars['String']['output'];
  /** The unique identifier for the resource */
  id: Scalars['ID']['output'];
  /** Recording mode (live, recorded or birdnetpi) */
  mode?: Maybe<Scalars['String']['output']>;
  /** Reported probability */
  probability?: Maybe<Scalars['Float']['output']>;
  /** Calculated score */
  score: Scalars['Float']['output'];
  /** Associated soundscape (optional) */
  soundscape?: Maybe<Soundscape>;
  /** Detection species */
  species: Species;
  /** Species ID */
  speciesId: Scalars['ID']['output'];
  /** Station that recorded this detection */
  station?: Maybe<Station>;
  /** Detection timestamp (in station time zone) */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** URL for up/downvote detections */
  voteUrl: Scalars['String']['output'];
};

/** The connection type for Detection. */
export type DetectionConnection = {
  __typename?: 'DetectionConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<DetectionEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<Detection>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  speciesCount: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type DetectionEdge = {
  __typename?: 'DetectionEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<Detection>;
};

export type DetectionsReading = {
  __typename?: 'DetectionsReading';
  detections: Scalars['Int']['output'];
  species: Scalars['Int']['output'];
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** The connection type for DetectionsReading. */
export type DetectionsReadingConnection = {
  __typename?: 'DetectionsReadingConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<DetectionsReadingEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<DetectionsReading>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type DetectionsReadingEdge = {
  __typename?: 'DetectionsReadingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<DetectionsReading>;
};

export type EnvironmentReading = {
  __typename?: 'EnvironmentReading';
  aqi?: Maybe<Scalars['Float']['output']>;
  barometricPressure?: Maybe<Scalars['Float']['output']>;
  eco2?: Maybe<Scalars['Float']['output']>;
  humidity?: Maybe<Scalars['Float']['output']>;
  soundPressureLevel?: Maybe<Scalars['Float']['output']>;
  temperature?: Maybe<Scalars['Float']['output']>;
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
  voc?: Maybe<Scalars['Float']['output']>;
};

/** The connection type for EnvironmentReading. */
export type EnvironmentReadingConnection = {
  __typename?: 'EnvironmentReadingConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<EnvironmentReadingEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<EnvironmentReading>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type EnvironmentReadingEdge = {
  __typename?: 'EnvironmentReadingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<EnvironmentReading>;
};

/** A time period (e.g. last 24 hours) or explicit date duration. */
export type InputDuration = {
  /** Number of units of time */
  count?: InputMaybe<Scalars['Int']['input']>;
  /** From date */
  from?: InputMaybe<Scalars['ISO8601Date']['input']>;
  /** Timezone for from/to dates */
  timezone?: InputMaybe<Scalars['TimeZone']['input']>;
  /** To date */
  to?: InputMaybe<Scalars['ISO8601Date']['input']>;
  /** Unit of time (hour/day/week/month/year) */
  unit?: InputMaybe<Scalars['String']['input']>;
};

/** A geographic location (latitude / longitude pair). */
export type InputLocation = {
  /** Latitude */
  lat: Scalars['Float']['input'];
  /** Longitude */
  lon: Scalars['Float']['input'];
};

export type LightReading = {
  __typename?: 'LightReading';
  clear?: Maybe<Scalars['Int']['output']>;
  f1?: Maybe<Scalars['Int']['output']>;
  f2?: Maybe<Scalars['Int']['output']>;
  f3?: Maybe<Scalars['Int']['output']>;
  f4?: Maybe<Scalars['Int']['output']>;
  f5?: Maybe<Scalars['Int']['output']>;
  f6?: Maybe<Scalars['Int']['output']>;
  f7?: Maybe<Scalars['Int']['output']>;
  f8?: Maybe<Scalars['Int']['output']>;
  nir?: Maybe<Scalars['Int']['output']>;
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** The connection type for LightReading. */
export type LightReadingConnection = {
  __typename?: 'LightReadingConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<LightReadingEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<LightReading>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type LightReadingEdge = {
  __typename?: 'LightReadingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<LightReading>;
};

export type LocationProbabilities = {
  __typename?: 'LocationProbabilities';
  /** Location coordinates */
  coords: Coordinates;
  /** Array of probabilities (monthly or 48 week) */
  probabilities: Array<Scalars['Float']['output']>;
};

export type LocationReading = {
  __typename?: 'LocationReading';
  altitude?: Maybe<Scalars['Float']['output']>;
  lat?: Maybe<Scalars['Float']['output']>;
  lon?: Maybe<Scalars['Float']['output']>;
  satellites?: Maybe<Scalars['Int']['output']>;
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** The connection type for LocationReading. */
export type LocationReadingConnection = {
  __typename?: 'LocationReadingConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<LocationReadingEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<LocationReading>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type LocationReadingEdge = {
  __typename?: 'LocationReadingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<LocationReading>;
};

export type MagReading = {
  __typename?: 'MagReading';
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
  x?: Maybe<Scalars['Float']['output']>;
  y?: Maybe<Scalars['Float']['output']>;
  z?: Maybe<Scalars['Float']['output']>;
};

/** The connection type for MagReading. */
export type MagReadingConnection = {
  __typename?: 'MagReadingConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<MagReadingEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<MagReading>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type MagReadingEdge = {
  __typename?: 'MagReadingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<MagReading>;
};

/** Autogenerated return type of NewDetection. */
export type NewDetectionPayload = {
  __typename?: 'NewDetectionPayload';
  detection: Detection;
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Probability = {
  __typename?: 'Probability';
  /** Probability of species for each month of year (0-12) [Fogleman] */
  months?: Maybe<Array<Scalars['Float']['output']>>;
  /** Species for this probability range */
  species: Species;
  /** Species ID */
  speciesId: Scalars['ID']['output'];
  /** Probability of species for each week of year (0-48) [BirdNET] */
  weeks?: Maybe<Array<Scalars['Float']['output']>>;
};

export enum ProbabilityModel {
  /** BirdNET */
  Birdnet = 'BIRDNET',
  /** BirdWeather */
  Birdweather = 'BIRDWEATHER',
  /** Fogleman */
  Fogleman = 'FOGLEMAN',
  /** iNaturalist */
  Inaturalist = 'INATURALIST'
}

export type Query = {
  __typename?: 'Query';
  /** Lookup multiple species by IDs */
  allSpecies?: Maybe<SpeciesConnection>;
  birdnetSightings: SightingConnection;
  counts: Counts;
  dailyDetectionCounts: Array<BinnedSpeciesSummaryCount>;
  /** List all detections */
  detections: DetectionConnection;
  ebirdSightings: Array<Sighting>;
  /** Search for species by common or scientific name */
  searchSpecies?: Maybe<SpeciesConnection>;
  /** Fetch species by ID or exact scientific name */
  species?: Maybe<Species>;
  station: Station;
  /** List all public stations. */
  stations: StationConnection;
  timeOfDayDetectionCounts: Array<BinnedSpeciesCount>;
  topBirdnetSpecies: Array<SpeciesCount>;
  topSpecies: Array<SpeciesCount>;
};


export type QueryAllSpeciesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  ids: Array<Scalars['ID']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryBirdnetSightingsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<InputLocation>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
  sw?: InputMaybe<InputLocation>;
};


export type QueryCountsArgs = {
  ne?: InputMaybe<InputLocation>;
  period?: InputMaybe<InputDuration>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
  stationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  stationTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  sw?: InputMaybe<InputLocation>;
};


export type QueryDailyDetectionCountsArgs = {
  period?: InputMaybe<InputDuration>;
  speciesIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  stationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type QueryDetectionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  classifications?: InputMaybe<Array<Scalars['String']['input']>>;
  confidenceGt?: InputMaybe<Scalars['Float']['input']>;
  confidenceGte?: InputMaybe<Scalars['Float']['input']>;
  confidenceLt?: InputMaybe<Scalars['Float']['input']>;
  confidenceLte?: InputMaybe<Scalars['Float']['input']>;
  continents?: InputMaybe<Array<Scalars['String']['input']>>;
  countries?: InputMaybe<Array<Scalars['String']['input']>>;
  eclipse?: InputMaybe<Scalars['Boolean']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<InputLocation>;
  overrideStationFilters?: InputMaybe<Scalars['Boolean']['input']>;
  period?: InputMaybe<InputDuration>;
  probabilityGt?: InputMaybe<Scalars['Float']['input']>;
  probabilityGte?: InputMaybe<Scalars['Float']['input']>;
  probabilityLt?: InputMaybe<Scalars['Float']['input']>;
  probabilityLte?: InputMaybe<Scalars['Float']['input']>;
  recordingModes?: InputMaybe<Array<Scalars['String']['input']>>;
  scoreGt?: InputMaybe<Scalars['Float']['input']>;
  scoreGte?: InputMaybe<Scalars['Float']['input']>;
  scoreLt?: InputMaybe<Scalars['Float']['input']>;
  scoreLte?: InputMaybe<Scalars['Float']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
  speciesIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  stationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  stationTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  sw?: InputMaybe<InputLocation>;
  timeOfDayGte?: InputMaybe<Scalars['Int']['input']>;
  timeOfDayLte?: InputMaybe<Scalars['Int']['input']>;
  uniqueStations?: InputMaybe<Scalars['Boolean']['input']>;
  validSoundscape?: InputMaybe<Scalars['Boolean']['input']>;
  vote?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEbirdSightingsArgs = {
  center: InputLocation;
  period?: InputMaybe<InputDuration>;
  speciesId: Scalars['ID']['input'];
};


export type QuerySearchSpeciesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  searchLocale?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySpeciesArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  scientificName?: InputMaybe<Scalars['String']['input']>;
};


export type QueryStationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryStationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<InputLocation>;
  period?: InputMaybe<InputDuration>;
  query?: InputMaybe<Scalars['String']['input']>;
  sw?: InputMaybe<InputLocation>;
};


export type QueryTimeOfDayDetectionCountsArgs = {
  confidenceGt?: InputMaybe<Scalars['Float']['input']>;
  confidenceGte?: InputMaybe<Scalars['Float']['input']>;
  confidenceLt?: InputMaybe<Scalars['Float']['input']>;
  confidenceLte?: InputMaybe<Scalars['Float']['input']>;
  ne?: InputMaybe<InputLocation>;
  period?: InputMaybe<InputDuration>;
  probabilityGt?: InputMaybe<Scalars['Float']['input']>;
  probabilityGte?: InputMaybe<Scalars['Float']['input']>;
  probabilityLt?: InputMaybe<Scalars['Float']['input']>;
  probabilityLte?: InputMaybe<Scalars['Float']['input']>;
  scoreGt?: InputMaybe<Scalars['Float']['input']>;
  scoreGte?: InputMaybe<Scalars['Float']['input']>;
  scoreLt?: InputMaybe<Scalars['Float']['input']>;
  scoreLte?: InputMaybe<Scalars['Float']['input']>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
  stationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  sw?: InputMaybe<InputLocation>;
  timeOfDayGte?: InputMaybe<Scalars['Int']['input']>;
  timeOfDayLte?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTopBirdnetSpeciesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<InputLocation>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
  sw?: InputMaybe<InputLocation>;
};


export type QueryTopSpeciesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<InputLocation>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
  recordingModes?: InputMaybe<Array<Scalars['String']['input']>>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
  stationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  stationTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  sw?: InputMaybe<InputLocation>;
};

export type Record = {
  /** The unique identifier for the resource */
  id: Scalars['ID']['output'];
};

/** Container type for PUC sensor readings */
export type Sensors = {
  __typename?: 'Sensors';
  /** Latest accelerometer sensor data reading */
  accel?: Maybe<AccelReading>;
  /** Accelerometer sensor data reading history */
  accelHistory: AccelReadingConnection;
  /** Detection counts history */
  detectionsHistory: DetectionsReadingConnection;
  /** Latest environmental sensor data reading */
  environment?: Maybe<EnvironmentReading>;
  /** Environmental sensor data reading history */
  environmentHistory: EnvironmentReadingConnection;
  /** Latest light sensor data reading */
  light?: Maybe<LightReading>;
  /** Light sensor data reading history */
  lightHistory: LightReadingConnection;
  /** Latest location sensor data reading */
  location?: Maybe<LocationReading>;
  /** Location sensor data reading history */
  locationHistory: LocationReadingConnection;
  /** Latest magnetometer sensor data reading */
  mag?: Maybe<MagReading>;
  /** Magnetometer sensor data reading history */
  magHistory: MagReadingConnection;
  /** Latest system info reading */
  system?: Maybe<SystemReading>;
  /** System info reading history */
  systemHistory: SystemReadingConnection;
};


/** Container type for PUC sensor readings */
export type SensorsAccelHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
};


/** Container type for PUC sensor readings */
export type SensorsDetectionsHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
};


/** Container type for PUC sensor readings */
export type SensorsEnvironmentHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
};


/** Container type for PUC sensor readings */
export type SensorsLightHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
};


/** Container type for PUC sensor readings */
export type SensorsLocationHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
};


/** Container type for PUC sensor readings */
export type SensorsMagHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
};


/** Container type for PUC sensor readings */
export type SensorsSystemHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
};

/** A BirdNET or eBird sighting. */
export type Sighting = Record & {
  __typename?: 'Sighting';
  coords: Coordinates;
  /** The unique identifier for the resource */
  id: Scalars['ID']['output'];
  score: Scalars['Float']['output'];
  species: Species;
  speciesId: Scalars['ID']['output'];
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
};

/** The connection type for Sighting. */
export type SightingConnection = {
  __typename?: 'SightingConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<SightingEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<Sighting>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SightingEdge = {
  __typename?: 'SightingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<Sighting>;
};

/** A soundscape file uploaded by a BirdWeather station. */
export type Soundscape = Record & {
  __typename?: 'Soundscape';
  /** Suggested filename of audio file */
  downloadFilename: Scalars['String']['output'];
  /** Duration (in seconds) of the audio file */
  duration?: Maybe<Scalars['Int']['output']>;
  /** End time (in seconds) of the detection */
  endTime: Scalars['Float']['output'];
  /** Size (in bytes) of the audio file */
  filesize: Scalars['Int']['output'];
  /** The unique identifier for the resource */
  id: Scalars['ID']['output'];
  /** Recording mode (live, recorded or birdnetpi) */
  mode: Scalars['String']['output'];
  /** Starting time (in seconds) of the detection */
  startTime: Scalars['Float']['output'];
  /** Station that recorded this soundscape */
  station?: Maybe<Station>;
  /** Timestamp of the soundscape */
  timestamp: Scalars['ISO8601DateTime']['output'];
  /** URL for the audio file */
  url: Scalars['String']['output'];
};

export type Species = Record & {
  __typename?: 'Species';
  /** 4-letter alpha code */
  alpha?: Maybe<Scalars['String']['output']>;
  /** 6-letter alpha code */
  alpha6?: Maybe<Scalars['String']['output']>;
  /** URL to BirdWeather species page */
  birdweatherUrl?: Maybe<Scalars['String']['output']>;
  /** Taxonomic classification (e.g. 'avian', 'amphibian', 'insect', 'mammal', 'bat') */
  classification: Scalars['String']['output'];
  /** Assigned color */
  color: Scalars['String']['output'];
  /** Common name */
  commonName: Scalars['String']['output'];
  detectionCounts: BinnedSpeciesCount;
  /** eBird alpha code */
  ebirdCode?: Maybe<Scalars['String']['output']>;
  /** URL to eBird page */
  ebirdUrl?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for the resource */
  id: Scalars['ID']['output'];
  /** Credited author of image */
  imageCredit?: Maybe<Scalars['String']['output']>;
  /** Name of image license */
  imageLicense?: Maybe<Scalars['String']['output']>;
  /** URL to image license page */
  imageLicenseUrl?: Maybe<Scalars['String']['output']>;
  /** 400x400 image URL */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** URL to Macaulay Library page */
  mlUrl?: Maybe<Scalars['String']['output']>;
  predictionArea?: Maybe<Scalars['JSON']['output']>;
  probabilities?: Maybe<SpeciesProbabilities>;
  range?: Maybe<Scalars['JSON']['output']>;
  /** Scientific name */
  scientificName?: Maybe<Scalars['String']['output']>;
  /** List stations with species detection */
  stations: Array<StationCount>;
  /** Thumbnail image encoded as a ThumbHash */
  thumbhash?: Maybe<Scalars['String']['output']>;
  /** 100x100 thumbnail image URL */
  thumbnailUrl?: Maybe<Scalars['String']['output']>;
  /** List top detection for each station the species was detected at */
  topDetections: DetectionConnection;
  translations: Array<SpeciesTranslation>;
  /** Wikipedia extract */
  wikipediaSummary?: Maybe<Scalars['String']['output']>;
  /** URL to Wikipedia page */
  wikipediaUrl?: Maybe<Scalars['String']['output']>;
};


export type SpeciesDetectionCountsArgs = {
  group?: InputMaybe<Scalars['Int']['input']>;
  ne?: InputMaybe<InputLocation>;
  period?: InputMaybe<InputDuration>;
  stationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  sw?: InputMaybe<InputLocation>;
};


export type SpeciesProbabilitiesArgs = {
  model: ProbabilityModel;
  ne?: InputMaybe<InputLocation>;
  sw?: InputMaybe<InputLocation>;
};


export type SpeciesStationsArgs = {
  ne?: InputMaybe<InputLocation>;
  period?: InputMaybe<InputDuration>;
  stationTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  sw?: InputMaybe<InputLocation>;
};


export type SpeciesTopDetectionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
};


export type SpeciesTranslationsArgs = {
  locale?: InputMaybe<Scalars['String']['input']>;
};

/** The connection type for Species. */
export type SpeciesConnection = {
  __typename?: 'SpeciesConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<SpeciesEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<Species>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type SpeciesCount = {
  __typename?: 'SpeciesCount';
  averageProbability?: Maybe<Scalars['Float']['output']>;
  breakdown?: Maybe<SpeciesCountBreakdown>;
  count: Scalars['Int']['output'];
  species?: Maybe<Species>;
  speciesId: Scalars['ID']['output'];
};

export type SpeciesCountBin = {
  __typename?: 'SpeciesCountBin';
  count: Scalars['Int']['output'];
  key: Scalars['SpeciesCountKey']['output'];
};

export type SpeciesCountBreakdown = {
  __typename?: 'SpeciesCountBreakdown';
  /** Count of almost certain detections */
  almostCertain: Scalars['Int']['output'];
  /** Count of uncertain detections */
  uncertain: Scalars['Int']['output'];
  /** Count of unlikely detections */
  unlikely: Scalars['Int']['output'];
  /** Count of very likely detections */
  veryLikely: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SpeciesEdge = {
  __typename?: 'SpeciesEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<Species>;
};

export type SpeciesProbabilities = {
  __typename?: 'SpeciesProbabilities';
  /** Probabilities for each location */
  locations: Array<LocationProbabilities>;
  /** Geographic precision (in degrees) of location probabilities */
  precision: Scalars['Float']['output'];
  /** Species */
  species: Species;
  /** Species ID */
  speciesId: Scalars['ID']['output'];
};

export type SpeciesTranslation = {
  __typename?: 'SpeciesTranslation';
  commonName?: Maybe<Scalars['String']['output']>;
  locale: Scalars['String']['output'];
  wikipediaSummary?: Maybe<Scalars['String']['output']>;
  wikipediaUrl?: Maybe<Scalars['String']['output']>;
};

/** A BirdWeather station (either real or virtual). */
export type Station = Record & {
  __typename?: 'Station';
  /** Air pollution data from OpenWeather */
  airPollution?: Maybe<AirPollutionReading>;
  /** Station audio feed URL */
  audioUrl?: Maybe<Scalars['String']['output']>;
  /** Continent */
  continent?: Maybe<Scalars['String']['output']>;
  /** Location coordinates */
  coords?: Maybe<Coordinates>;
  /** Country name */
  country?: Maybe<Scalars['String']['output']>;
  counts: StationCounts;
  detectionCounts: Array<BinnedSpeciesCount>;
  detections: DetectionConnection;
  /** Timestamp of earliest detection */
  earliestDetectionAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** The station's vicinity to the 2024 Solar Eclipse path of totality (total, partial or null) */
  eclipse?: Maybe<Scalars['String']['output']>;
  hasProbabilities: Scalars['Boolean']['output'];
  /** The unique identifier for the resource */
  id: Scalars['ID']['output'];
  /** Timestamp of latest detection */
  latestDetectionAt?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Human-readable location */
  location?: Maybe<Scalars['String']['output']>;
  /** Location privacy enabled */
  locationPrivacy: Scalars['Boolean']['output'];
  /** Station minimum confidence setting */
  minConfidence?: Maybe<Scalars['Float']['output']>;
  /** Station minimum probability setting */
  minProbability?: Maybe<Scalars['Float']['output']>;
  /** Station minimum score setting */
  minScore?: Maybe<Scalars['Float']['output']>;
  /** Station name */
  name: Scalars['String']['output'];
  /** Station notes (optional) */
  notes?: Maybe<Scalars['String']['output']>;
  /** Station supports detections outside of the station location */
  portableDetections: Scalars['Boolean']['output'];
  probabilities: Array<Probability>;
  sensors?: Maybe<Sensors>;
  /** @deprecated Stream source URL (use audioUrl/videoUrl instead) */
  source?: Maybe<Scalars['String']['output']>;
  /** State/province/region */
  state?: Maybe<Scalars['String']['output']>;
  timeOfDayDetectionCounts: Array<BinnedSpeciesCount>;
  /** Timezone string */
  timezone: Scalars['String']['output'];
  topSpecies: Array<SpeciesCount>;
  /** Station type (birdnetpi, puc, mobile, stream_youtube, stream_audio) */
  type: Scalars['String']['output'];
  /** Station video feed URL */
  videoUrl?: Maybe<Scalars['String']['output']>;
  /** Weather data from OpenWeather */
  weather?: Maybe<WeatherReading>;
};


/** A BirdWeather station (either real or virtual). */
export type StationCountsArgs = {
  period?: InputMaybe<InputDuration>;
};


/** A BirdWeather station (either real or virtual). */
export type StationDetectionCountsArgs = {
  confidenceGt?: InputMaybe<Scalars['Float']['input']>;
  confidenceGte?: InputMaybe<Scalars['Float']['input']>;
  confidenceLt?: InputMaybe<Scalars['Float']['input']>;
  confidenceLte?: InputMaybe<Scalars['Float']['input']>;
  ne?: InputMaybe<InputLocation>;
  period?: InputMaybe<InputDuration>;
  probabilityGt?: InputMaybe<Scalars['Float']['input']>;
  probabilityGte?: InputMaybe<Scalars['Float']['input']>;
  probabilityLt?: InputMaybe<Scalars['Float']['input']>;
  probabilityLte?: InputMaybe<Scalars['Float']['input']>;
  scoreGt?: InputMaybe<Scalars['Float']['input']>;
  scoreGte?: InputMaybe<Scalars['Float']['input']>;
  scoreLt?: InputMaybe<Scalars['Float']['input']>;
  scoreLte?: InputMaybe<Scalars['Float']['input']>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
  sw?: InputMaybe<InputLocation>;
  timeOfDayGte?: InputMaybe<Scalars['Int']['input']>;
  timeOfDayLte?: InputMaybe<Scalars['Int']['input']>;
};


/** A BirdWeather station (either real or virtual). */
export type StationDetectionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


/** A BirdWeather station (either real or virtual). */
export type StationSensorsArgs = {
  fieldName?: InputMaybe<Scalars['String']['input']>;
  sensorType?: InputMaybe<Scalars['String']['input']>;
};


/** A BirdWeather station (either real or virtual). */
export type StationTimeOfDayDetectionCountsArgs = {
  confidenceGt?: InputMaybe<Scalars['Float']['input']>;
  confidenceGte?: InputMaybe<Scalars['Float']['input']>;
  confidenceLt?: InputMaybe<Scalars['Float']['input']>;
  confidenceLte?: InputMaybe<Scalars['Float']['input']>;
  ne?: InputMaybe<InputLocation>;
  period?: InputMaybe<InputDuration>;
  probabilityGt?: InputMaybe<Scalars['Float']['input']>;
  probabilityGte?: InputMaybe<Scalars['Float']['input']>;
  probabilityLt?: InputMaybe<Scalars['Float']['input']>;
  probabilityLte?: InputMaybe<Scalars['Float']['input']>;
  scoreGt?: InputMaybe<Scalars['Float']['input']>;
  scoreGte?: InputMaybe<Scalars['Float']['input']>;
  scoreLt?: InputMaybe<Scalars['Float']['input']>;
  scoreLte?: InputMaybe<Scalars['Float']['input']>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
  sw?: InputMaybe<InputLocation>;
  timeOfDayGte?: InputMaybe<Scalars['Int']['input']>;
  timeOfDayLte?: InputMaybe<Scalars['Int']['input']>;
};


/** A BirdWeather station (either real or virtual). */
export type StationTopSpeciesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  period?: InputMaybe<InputDuration>;
  speciesId?: InputMaybe<Scalars['ID']['input']>;
};

/** The connection type for Station. */
export type StationConnection = {
  __typename?: 'StationConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<StationEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<Station>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type StationCount = {
  __typename?: 'StationCount';
  count: Scalars['Int']['output'];
  station: Station;
};

export type StationCounts = {
  __typename?: 'StationCounts';
  detections: Scalars['Int']['output'];
  species: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type StationEdge = {
  __typename?: 'StationEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<Station>;
};

export type Subscription = {
  __typename?: 'Subscription';
  newDetection: NewDetectionPayload;
};


export type SubscriptionNewDetectionArgs = {
  classifications?: InputMaybe<Array<Scalars['String']['input']>>;
  confidenceGt?: InputMaybe<Scalars['Float']['input']>;
  confidenceGte?: InputMaybe<Scalars['Float']['input']>;
  confidenceLt?: InputMaybe<Scalars['Float']['input']>;
  confidenceLte?: InputMaybe<Scalars['Float']['input']>;
  continents?: InputMaybe<Array<Scalars['String']['input']>>;
  countries?: InputMaybe<Array<Scalars['String']['input']>>;
  overrideStationFilters?: InputMaybe<Scalars['Boolean']['input']>;
  probabilityGt?: InputMaybe<Scalars['Float']['input']>;
  probabilityGte?: InputMaybe<Scalars['Float']['input']>;
  probabilityLt?: InputMaybe<Scalars['Float']['input']>;
  probabilityLte?: InputMaybe<Scalars['Float']['input']>;
  recordingModes?: InputMaybe<Array<Scalars['String']['input']>>;
  scoreGt?: InputMaybe<Scalars['Float']['input']>;
  scoreGte?: InputMaybe<Scalars['Float']['input']>;
  scoreLt?: InputMaybe<Scalars['Float']['input']>;
  scoreLte?: InputMaybe<Scalars['Float']['input']>;
  speciesIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  stationIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  stationTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  timeOfDayGte?: InputMaybe<Scalars['Int']['input']>;
  timeOfDayLte?: InputMaybe<Scalars['Int']['input']>;
};

export type SummarySpeciesCount = {
  __typename?: 'SummarySpeciesCount';
  count: Scalars['Int']['output'];
  species: Species;
  speciesId: Scalars['ID']['output'];
};

export type SystemReading = {
  __typename?: 'SystemReading';
  batteryVoltage?: Maybe<Scalars['Float']['output']>;
  firmware?: Maybe<Scalars['String']['output']>;
  powerSource?: Maybe<Scalars['String']['output']>;
  sdAvailable?: Maybe<Scalars['BigInt']['output']>;
  sdCapacity?: Maybe<Scalars['BigInt']['output']>;
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
  uploadingCompleted?: Maybe<Scalars['Int']['output']>;
  uploadingTotal?: Maybe<Scalars['Int']['output']>;
  wifiRssi?: Maybe<Scalars['Int']['output']>;
};

/** The connection type for SystemReading. */
export type SystemReadingConnection = {
  __typename?: 'SystemReadingConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<SystemReadingEdge>>>;
  /** A list of nodes. */
  nodes?: Maybe<Array<Maybe<SystemReading>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SystemReadingEdge = {
  __typename?: 'SystemReadingEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node?: Maybe<SystemReading>;
};

/** Weather reading provided by OpenWeather */
export type WeatherReading = {
  __typename?: 'WeatherReading';
  /** Cloudiness, % */
  cloudiness: Scalars['Int']['output'];
  /** Geographic coordinates of the reading */
  coords: Coordinates;
  /** Group of weather parameters (Rain, Snow, Extreme etc.) */
  description: Scalars['String']['output'];
  /** Temperature, Kelvin. This temperature parameter accounts for the human perception of weather */
  feelsLike: Scalars['Float']['output'];
  /** Atmospheric pressure on the ground level, hPa */
  groundLevel?: Maybe<Scalars['Int']['output']>;
  /** Humidity, % */
  humidity: Scalars['Int']['output'];
  /** Atmospheric pressure (on the sea level, if there is no sea_level or grnd_level data), hPa */
  pressure: Scalars['Int']['output'];
  /** Rain volume for the last 1 hour, mm */
  rain1h?: Maybe<Scalars['Float']['output']>;
  /** Rain volume for the last 3 hours, mm */
  rain3h?: Maybe<Scalars['Float']['output']>;
  /** Atmospheric pressure on the sea level, hPa */
  seaLevel?: Maybe<Scalars['Int']['output']>;
  /** Snow volume for the last 1 hour, mm */
  snow1h?: Maybe<Scalars['Float']['output']>;
  /** Snow volume for the last 3 hours, mm */
  snow3h?: Maybe<Scalars['Float']['output']>;
  /** Sunrise time */
  sunrise: Scalars['ISO8601DateTime']['output'];
  /** Sunset time */
  sunset: Scalars['ISO8601DateTime']['output'];
  /** Temperature, Kelvin */
  temp: Scalars['Float']['output'];
  /** Maximum temperature at the moment, Kelvin. This is maximal currently observed temperature (within large megalopolises and urban areas) */
  tempMax: Scalars['Float']['output'];
  /** Minimum temperature at the moment, Kelvin. This is minimal currently observed temperature (within large megalopolises and urban areas) */
  tempMin: Scalars['Float']['output'];
  /** Reading timestamp */
  timestamp?: Maybe<Scalars['ISO8601DateTime']['output']>;
  /** Visibility, meters */
  visibility: Scalars['Int']['output'];
  /** Wind direction, degrees (meteorological) */
  windDir: Scalars['Int']['output'];
  /** Wind gust, meter/sec */
  windGust?: Maybe<Scalars['Float']['output']>;
  /** Wind speed, meter/sec */
  windSpeed: Scalars['Float']['output'];
};

export type DailyDetectionsQueryVariables = Exact<{
  stationId: Scalars['ID']['input'];
  days: Scalars['Int']['input'];
}>;


export type DailyDetectionsQuery = { __typename?: 'Query', dailyDetectionCounts: Array<{ __typename?: 'BinnedSpeciesSummaryCount', date: any, dayOfYear: number, counts: Array<{ __typename?: 'SummarySpeciesCount', count: number, species: { __typename?: 'Species', alpha?: string | null, commonName: string } }> }> };

export type AllDetectionsInPeriodQueryVariables = Exact<{
  stationId: Scalars['ID']['input'];
  from: Scalars['ISO8601Date']['input'];
  to: Scalars['ISO8601Date']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type AllDetectionsInPeriodQuery = { __typename?: 'Query', detections: { __typename?: 'DetectionConnection', pageInfo: { __typename?: 'PageInfo', startCursor?: string | null, endCursor?: string | null, hasNextPage: boolean, hasPreviousPage: boolean }, edges?: Array<{ __typename?: 'DetectionEdge', cursor: string, node?: { __typename?: 'Detection', timestamp?: any | null, confidence: number, probability?: number | null, score: number, species: { __typename?: 'Species', commonName: string } } | null } | null> | null } };

export type BucketSpeciesObservationsQueryVariables = Exact<{
  speciesId: Scalars['ID']['input'];
  stationId: Scalars['ID']['input'];
  fromDate: Scalars['ISO8601Date']['input'];
  toDate: Scalars['ISO8601Date']['input'];
  bucketMinutes: Scalars['Int']['input'];
}>;


export type BucketSpeciesObservationsQuery = { __typename?: 'Query', species?: { __typename?: 'Species', commonName: string, id: string, detectionCounts: { __typename?: 'BinnedSpeciesCount', count: number, bins: Array<{ __typename?: 'SpeciesCountBin', key: any, count: number }> } } | null };

export type StationInfoQueryVariables = Exact<{
  stationId: Scalars['ID']['input'];
}>;


export type StationInfoQuery = { __typename?: 'Query', station: { __typename?: 'Station', id: string, name: string, state?: string | null, country?: string | null, continent?: string | null, location?: string | null, locationPrivacy: boolean, type: string, earliestDetectionAt?: any | null, coords?: { __typename?: 'Coordinates', lat: number, lon: number } | null } };

export type SpeciesInfoByIdQueryVariables = Exact<{
  speciesId: Scalars['ID']['input'];
}>;


export type SpeciesInfoByIdQuery = { __typename?: 'Query', species?: { __typename?: 'Species', id: string, alpha?: string | null, commonName: string, scientificName?: string | null, classification: string } | null };

export type SearchSpeciesQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
}>;


export type SearchSpeciesQuery = { __typename?: 'Query', searchSpecies?: { __typename?: 'SpeciesConnection', pageInfo: { __typename?: 'PageInfo', hasPreviousPage: boolean, hasNextPage: boolean, endCursor?: string | null }, nodes?: Array<{ __typename?: 'Species', id: string, alpha?: string | null, alpha6?: string | null, birdweatherUrl?: string | null, commonName: string, scientificName?: string | null } | null> | null } | null };


export const DailyDetectionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DailyDetections"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"days"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailyDetectionCounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"stationIds"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"stationId"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"period"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"count"},"value":{"kind":"Variable","name":{"kind":"Name","value":"days"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"unit"},"value":{"kind":"StringValue","value":"day","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"dayOfYear"}},{"kind":"Field","name":{"kind":"Name","value":"counts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"species"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alpha"}},{"kind":"Field","name":{"kind":"Name","value":"commonName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DailyDetectionsQuery, DailyDetectionsQueryVariables>;
export const AllDetectionsInPeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AllDetectionsInPeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISO8601Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISO8601Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"detections"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"stationIds"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"stationId"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"period"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"species"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commonName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"probability"}},{"kind":"Field","name":{"kind":"Name","value":"score"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AllDetectionsInPeriodQuery, AllDetectionsInPeriodQueryVariables>;
export const BucketSpeciesObservationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BucketSpeciesObservations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"speciesId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISO8601Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISO8601Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"bucketMinutes"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"species"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"speciesId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"commonName"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"detectionCounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"period"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"group"},"value":{"kind":"Variable","name":{"kind":"Name","value":"bucketMinutes"}}},{"kind":"Argument","name":{"kind":"Name","value":"stationIds"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"stationId"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"bins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]}}]} as unknown as DocumentNode<BucketSpeciesObservationsQuery, BucketSpeciesObservationsQueryVariables>;
export const StationInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StationInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"station"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"continent"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"locationPrivacy"}},{"kind":"Field","name":{"kind":"Name","value":"coords"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"earliestDetectionAt"}}]}}]}}]} as unknown as DocumentNode<StationInfoQuery, StationInfoQueryVariables>;
export const SpeciesInfoByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SpeciesInfoById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"speciesId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"species"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"speciesId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"alpha"}},{"kind":"Field","name":{"kind":"Name","value":"commonName"}},{"kind":"Field","name":{"kind":"Name","value":"scientificName"}},{"kind":"Field","name":{"kind":"Name","value":"classification"}}]}}]}}]} as unknown as DocumentNode<SpeciesInfoByIdQuery, SpeciesInfoByIdQueryVariables>;
export const SearchSpeciesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchSpecies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchSpecies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"alpha"}},{"kind":"Field","name":{"kind":"Name","value":"alpha6"}},{"kind":"Field","name":{"kind":"Name","value":"birdweatherUrl"}},{"kind":"Field","name":{"kind":"Name","value":"commonName"}},{"kind":"Field","name":{"kind":"Name","value":"scientificName"}}]}}]}}]}}]} as unknown as DocumentNode<SearchSpeciesQuery, SearchSpeciesQueryVariables>;