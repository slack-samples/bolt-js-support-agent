export function createFeedbackBlock() {
  return [
    {
      type: 'context_actions',
      elements: [
        {
          type: 'feedback_buttons',
          action_id: 'feedback',
          positive_button: {
            text: { type: 'plain_text', text: 'Good Response' },
            accessibility_label: 'Submit positive feedback on this response',
            value: 'good-feedback',
          },
          negative_button: {
            text: { type: 'plain_text', text: 'Bad Response' },
            accessibility_label: 'Submit negative feedback on this response',
            value: 'bad-feedback',
          },
        },
      ],
    },
  ];
}
