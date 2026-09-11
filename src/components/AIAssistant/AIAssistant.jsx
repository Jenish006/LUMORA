import { API_BASE_URL } from '../../api';
import {
  ArrowRight,
  Sparkles,
  Send,
  RotateCcw,
  MapPin,
  Star,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './AIAssistant.css';

const suggestions = [
  'A romantic dinner for two',
  'A private dining room',
  'Best fine dining tonight',
];

function AIAssistant() {
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [submittedMessage, setSubmittedMessage] =
    useState('');

  const [isThinking, setIsThinking] =
    useState(false);

  const [restaurants, setRestaurants] =
    useState([]);

  const [recommendation, setRecommendation] =
    useState(null);

  /*
   * LOAD LUMORA RESTAURANTS
   */
  useEffect(() => {
    let cancelled = false;

    const loadRestaurants = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/restaurants`,
          {
            method: 'GET',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              'Unable to load restaurants'
          );
        }

        if (!cancelled) {
          setRestaurants(
            data.restaurants || []
          );
        }
      } catch (error) {
        console.error(
          'AI restaurant loading error:',
          error
        );
      }
    };

    loadRestaurants();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * FIND BEST RESTAURANT
   */
  const findRecommendation = (query) => {
    const text = query.toLowerCase();

    if (!restaurants.length) {
      return null;
    }

    const scoredRestaurants =
      restaurants.map((restaurant) => {
        let score = 0;

        const name = String(
          restaurant.name || ''
        ).toLowerCase();

        const cuisine = String(
          restaurant.cuisine || ''
        ).toLowerCase();

        const description = String(
          restaurant.description || ''
        ).toLowerCase();

        const priceRange = String(
          restaurant.price_range || ''
        ).toLowerCase();

        /*
         * ROMANTIC / DATE NIGHT
         */
        if (
          text.includes('romantic') ||
          text.includes('date') ||
          text.includes('couple') ||
          text.includes('dinner for two') ||
          text.includes('special evening')
        ) {
          if (
            name.includes('maison') ||
            description.includes('memorable') ||
            description.includes('sophisticated') ||
            cuisine.includes('fine dining')
          ) {
            score += 10;
          }
        }

        /*
         * FINE DINING
         */
        if (
          text.includes('fine dining') ||
          text.includes('luxury') ||
          text.includes('luxurious') ||
          text.includes('elegant') ||
          text.includes('premium')
        ) {
          if (
            cuisine.includes('fine dining') ||
            name.includes('maison') ||
            name.includes('aurelia')
          ) {
            score += 10;
          }

          if (
            priceRange.includes('4000')
          ) {
            score += 4;
          }
        }

        /*
         * JAPANESE
         */
        if (
          text.includes('japanese') ||
          text.includes('omakase') ||
          text.includes('sushi')
        ) {
          if (
            cuisine.includes('japanese') ||
            cuisine.includes('omakase') ||
            name.includes('sora')
          ) {
            score += 15;
          }
        }

        /*
         * INDIAN
         */
        if (
          text.includes('indian') ||
          text.includes('traditional') ||
          text.includes('indian food')
        ) {
          if (
            cuisine.includes('indian') ||
            name.includes('velora')
          ) {
            score += 15;
          }
        }

        /*
         * EUROPEAN
         */
        if (
          text.includes('european') ||
          text.includes('modern european')
        ) {
          if (
            cuisine.includes('european') ||
            name.includes('aurelia')
          ) {
            score += 15;
          }
        }

        /*
         * PRIVATE / INTIMATE
         */
        if (
          text.includes('private') ||
          text.includes('intimate') ||
          text.includes('quiet') ||
          text.includes('private dining')
        ) {
          if (
            description.includes('intimate') ||
            description.includes('sophisticated') ||
            name.includes('maison')
          ) {
            score += 10;
          }
        }

        /*
         * FAMILY
         */
        if (
          text.includes('family') ||
          text.includes('family dinner')
        ) {
          if (
            cuisine.includes('indian') ||
            name.includes('velora')
          ) {
            score += 8;
          }
        }

        /*
         * GENERIC DINNER
         */
        if (
          text.includes('dinner') &&
          score === 0
        ) {
          score += 1;
        }

        return {
          restaurant,
          score,
        };
      });

    scoredRestaurants.sort(
      (a, b) => b.score - a.score
    );

    return scoredRestaurants[0]?.restaurant || null;
  };

  /*
   * CREATE AI RESPONSE
   */
  const createRecommendationText = (
    restaurant,
    query
  ) => {
    const text = query.toLowerCase();

    if (!restaurant) {
      return 'I could not find a close match from our current restaurants. Try asking for a cuisine, occasion, or dining style.';
    }

    if (
      text.includes('romantic') ||
      text.includes('date') ||
      text.includes('couple') ||
      text.includes('dinner for two')
    ) {
      return `${restaurant.name} is my recommendation for this occasion. Its atmosphere and dining experience make it a beautiful choice for a romantic evening for two.`;
    }

    if (
      text.includes('japanese') ||
      text.includes('omakase') ||
      text.includes('sushi')
    ) {
      return `${restaurant.name} is the best match for your Japanese dining request, with a focused omakase experience built around precision and freshness.`;
    }

    if (
      text.includes('fine dining') ||
      text.includes('luxury') ||
      text.includes('elegant')
    ) {
      return `${restaurant.name} is my recommendation for an elevated fine-dining experience, with sophisticated surroundings and refined cuisine.`;
    }

    if (
      text.includes('private') ||
      text.includes('intimate') ||
      text.includes('quiet')
    ) {
      return `${restaurant.name} is a strong match for an intimate dining experience and a more special atmosphere.`;
    }

    if (
      text.includes('indian')
    ) {
      return `${restaurant.name} is my recommendation for contemporary Indian dining, combining traditional flavours with modern presentation.`;
    }

    if (
      text.includes('european')
    ) {
      return `${restaurant.name} is a great match for modern European dining, with an elegant experience and refined cuisine.`;
    }

    return `${restaurant.name} is my recommendation based on what you're looking for. It offers a dining experience that closely matches your request.`;
  };

  /*
   * SUBMIT
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    const value = message.trim();

    if (!value || isThinking) return;

    setSubmittedMessage(value);
    setRecommendation(null);
    setIsThinking(true);

    setTimeout(() => {
      const result =
        findRecommendation(value);

      setRecommendation(result);
      setIsThinking(false);
    }, 1000);
  };

  /*
   * SUGGESTION
   */
  const handleSuggestion = (suggestion) => {
    setMessage(suggestion);
  };

  /*
   * RESET
   */
  const handleReset = () => {
    setMessage('');
    setSubmittedMessage('');
    setIsThinking(false);
    setRecommendation(null);
  };

  /*
   * OPEN RESTAURANT
   */
  const handleRestaurantClick = () => {
    if (!recommendation?.id) return;

    navigate(
      `/restaurant/${recommendation.id}`
    );
  };

  return (
    <section
      className="ai-assistant"
      id="ai-assistant"
    >
      <div className="container">

        <div className="ai-card">

          {/* BACKGROUND GLOW */}

          <div className="ai-glow ai-glow-one"></div>
          <div className="ai-glow ai-glow-two"></div>

          {/* ORBIT */}

          <div className="ai-orbit">

            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="orbit orbit-three"></div>

            <div className="orbit-center">
              <Sparkles
                size={25}
                strokeWidth={1.2}
              />
            </div>

          </div>

          {/* CONTENT */}

          <div className="ai-content">

            <div className="ai-icon">
              <Sparkles
                size={17}
                strokeWidth={1.4}
              />
            </div>

            <p className="ai-eyebrow">
              LUMORA INTELLIGENCE
            </p>

            <h2>
              Let us find
              <span>your table.</span>
            </h2>

            <p className="ai-description">
              Tell us what you're looking for.
              Our AI dining assistant will
              recommend a restaurant and
              experience that matches your
              occasion.
            </p>

            {/* SUGGESTIONS */}

            <div className="ai-suggestions">

              {suggestions.map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      handleSuggestion(
                        suggestion
                      )
                    }
                  >
                    {suggestion}
                  </button>
                )
              )}

            </div>

            {/* INPUT */}

            <form
              className="ai-input"
              onSubmit={handleSubmit}
            >

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder="Tell us what you're looking for..."
                aria-label="Ask Lumora AI"
              />

              <button
                type="submit"
                className="ai-send"
                aria-label="Send request"
                disabled={
                  !message.trim() ||
                  isThinking
                }
              >
                {isThinking ? (
                  <span className="ai-loader"></span>
                ) : (
                  <Send
                    size={16}
                    strokeWidth={1.5}
                  />
                )}
              </button>

            </form>

            {/* AI RESPONSE */}

            {submittedMessage && (
              <div className="ai-response">

                <div className="ai-response-top">

                  <span>
                    <Sparkles
                      size={13}
                      strokeWidth={1.4}
                    />
                    LUMORA AI
                  </span>

                  <button
                    type="button"
                    onClick={handleReset}
                    aria-label="Reset conversation"
                  >
                    <RotateCcw
                      size={13}
                      strokeWidth={1.4}
                    />
                  </button>

                </div>

                <div className="ai-user-message">
                  "{submittedMessage}"
                </div>

                <div className="ai-response-message">

                  {isThinking ? (

                    <div className="thinking">

                      <span></span>
                      <span></span>
                      <span></span>

                      <p>
                        Finding the perfect
                        restaurant...
                      </p>

                    </div>

                  ) : recommendation ? (

                    <>

                      <div className="ai-recommendation">

                        <div className="ai-recommendation-icon">
                          <Sparkles
                            size={18}
                            strokeWidth={1.3}
                          />
                        </div>

                        <div className="ai-recommendation-content">

                          <span className="ai-recommendation-label">
                            OUR RECOMMENDATION
                          </span>

                          <h3>
                            {recommendation.name}
                          </h3>

                          <div className="ai-recommendation-meta">

                            {recommendation.cuisine && (
                              <span>
                                <Sparkles
                                  size={12}
                                />
                                {recommendation.cuisine}
                              </span>
                            )}

                            {recommendation.rating && (
                              <span>
                                <Star
                                  size={12}
                                />
                                {recommendation.rating}
                              </span>
                            )}

                            {recommendation.city && (
                              <span>
                                <MapPin
                                  size={12}
                                />
                                {recommendation.city}
                              </span>
                            )}

                          </div>

                          <p>
                            {createRecommendationText(
                              recommendation,
                              submittedMessage
                            )}
                          </p>

                          {recommendation.description && (
                            <p className="ai-recommendation-description">
                              {recommendation.description}
                            </p>
                          )}

                        </div>

                      </div>

                      <button
                        type="button"
                        className="ai-find-button"
                        onClick={
                          handleRestaurantClick
                        }
                      >
                        View restaurant
                        <ArrowRight
                          size={15}
                          strokeWidth={1.4}
                        />
                      </button>

                    </>

                  ) : (

                    <p>
                      I couldn't find a close
                      match from our current
                      restaurants. Try asking for
                      a cuisine, occasion, or
                      dining style.
                    </p>

                  )}

                </div>

              </div>
            )}

            {/* MAIN BUTTON */}

            {!submittedMessage && (
              <button
                type="button"
                className="ai-button"
                onClick={() => {
                  const input =
                    document.querySelector(
                      '.ai-input input'
                    );

                  input?.focus();
                }}
              >
                Start with AI

                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                />
              </button>
            )}

          </div>

          {/* DECORATIVE LABEL */}

          <div className="ai-side-label">
            <span>AI</span>
            <span>DINING</span>
            <span>ASSISTANT</span>
          </div>

        </div>

      </div>
    </section>
  );
}

export default AIAssistant;